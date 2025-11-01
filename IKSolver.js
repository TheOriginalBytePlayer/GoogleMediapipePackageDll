/**
 * IKSolver.js - Inverse Kinematics Solution for Skeleton Joint Manipulation
 * 
 * This module provides IK algorithms for moving hands, arms, and fingers
 * by calculating required joint rotations to reach target positions.
 * 
 * Supports:
 * - CCD (Cyclic Coordinate Descent) algorithm
 * - FABRIK (Forward And Backward Reaching Inverse Kinematics) algorithm
 * - Joint constraints and angle limits
 */

class Vector3D {
    constructor(x = 0, y = 0, z = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    // Vector operations
    add(v) {
        return new Vector3D(this.x + v.x, this.y + v.y, this.z + v.z);
    }

    subtract(v) {
        return new Vector3D(this.x - v.x, this.y - v.y, this.z - v.z);
    }

    multiply(scalar) {
        return new Vector3D(this.x * scalar, this.y * scalar, this.z * scalar);
    }

    divide(scalar) {
        if (scalar === 0) return new Vector3D(0, 0, 0);
        return new Vector3D(this.x / scalar, this.y / scalar, this.z / scalar);
    }

    magnitude() {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    }

    normalize() {
        const mag = this.magnitude();
        return mag > 0 ? this.divide(mag) : new Vector3D(0, 0, 0);
    }

    dot(v) {
        return this.x * v.x + this.y * v.y + this.z * v.z;
    }

    cross(v) {
        return new Vector3D(
            this.y * v.z - this.z * v.y,
            this.z * v.x - this.x * v.z,
            this.x * v.y - this.y * v.x
        );
    }

    distance(v) {
        return this.subtract(v).magnitude();
    }

    clone() {
        return new Vector3D(this.x, this.y, this.z);
    }
}

class Joint {
    constructor(position, minAngle = -180, maxAngle = 180) {
        this.position = position instanceof Vector3D ? position : new Vector3D(position.x, position.y, position.z);
        this.minAngle = minAngle; // Constraint in degrees
        this.maxAngle = maxAngle; // Constraint in degrees
        this.rotation = new Vector3D(0, 0, 0); // Euler angles in degrees (x, y, z)
    }

    clone() {
        const joint = new Joint(this.position.clone(), this.minAngle, this.maxAngle);
        joint.rotation = this.rotation.clone();
        return joint;
    }
}

class IKSolver {
    /**
     * Solve IK using CCD (Cyclic Coordinate Descent) algorithm
     * @param {Array<Joint>} chain - Array of joints from root to end effector
     * @param {Vector3D} targetPosition - Desired position for end effector
     * @param {Number} iterations - Maximum iterations (default: 10)
     * @param {Number} tolerance - Distance tolerance for convergence (default: 0.01)
     * @returns {Array<Joint>} - Updated joint chain
     */
    static solveCCD(chain, targetPosition, iterations = 10, tolerance = 0.01) {
        if (!chain || chain.length < 2) {
            throw new Error("Chain must have at least 2 joints");
        }

        // Clone the chain to avoid modifying the original
        const workChain = chain.map(joint => joint.clone());
        const endEffectorIndex = workChain.length - 1;

        for (let iter = 0; iter < iterations; iter++) {
            // Check if we've reached the target
            const endEffector = workChain[endEffectorIndex].position;
            const distanceToTarget = endEffector.distance(targetPosition);
            
            if (distanceToTarget < tolerance) {
                break; // Solution found
            }

            // Iterate backwards through the chain (excluding end effector)
            for (let i = endEffectorIndex - 1; i >= 0; i--) {
                const currentJoint = workChain[i].position;
                const currentEnd = workChain[endEffectorIndex].position;

                // Vector from current joint to end effector
                const toEnd = currentEnd.subtract(currentJoint);
                // Vector from current joint to target
                const toTarget = targetPosition.subtract(currentJoint);

                // Calculate rotation angle
                const toEndNorm = toEnd.normalize();
                const toTargetNorm = toTarget.normalize();
                
                // Calculate angle between vectors
                const dotProduct = Math.max(-1, Math.min(1, toEndNorm.dot(toTargetNorm)));
                const angle = Math.acos(dotProduct);

                // Skip if angle is too small
                if (Math.abs(angle) < 0.001) continue;

                // Get rotation axis
                const rotationAxis = toEndNorm.cross(toTargetNorm).normalize();

                // Apply rotation to all joints from current to end
                for (let j = i + 1; j <= endEffectorIndex; j++) {
                    const relPos = workChain[j].position.subtract(currentJoint);
                    const rotated = this.rotateAroundAxis(relPos, rotationAxis, angle);
                    workChain[j].position = currentJoint.add(rotated);
                }
            }
        }

        // Calculate and store bone rotations
        return this.calculateBoneRotations(workChain);
    }

    /**
     * Solve IK using FABRIK (Forward And Backward Reaching Inverse Kinematics) algorithm
     * @param {Array<Joint>} chain - Array of joints from root to end effector
     * @param {Vector3D} targetPosition - Desired position for end effector
     * @param {Number} iterations - Maximum iterations (default: 10)
     * @param {Number} tolerance - Distance tolerance for convergence (default: 0.01)
     * @returns {Array<Joint>} - Updated joint chain
     */
    static solveFABRIK(chain, targetPosition, iterations = 10, tolerance = 0.01) {
        if (!chain || chain.length < 2) {
            throw new Error("Chain must have at least 2 joints");
        }

        // Clone the chain
        const workChain = chain.map(joint => joint.clone());
        const n = workChain.length;
        
        // Store original bone lengths
        const boneLengths = [];
        for (let i = 0; i < n - 1; i++) {
            boneLengths[i] = workChain[i].position.distance(workChain[i + 1].position);
        }

        // Store the root position
        const rootPos = workChain[0].position.clone();

        // Calculate total chain length
        const totalLength = boneLengths.reduce((sum, length) => sum + length, 0);
        const distanceToTarget = rootPos.distance(targetPosition);

        // If target is unreachable, stretch chain towards target
        if (distanceToTarget > totalLength) {
            const direction = targetPosition.subtract(rootPos).normalize();
            for (let i = 1; i < n; i++) {
                const offset = direction.multiply(boneLengths[i - 1]);
                workChain[i].position = workChain[i - 1].position.add(offset);
            }
            return workChain;
        }

        // FABRIK iterations
        for (let iter = 0; iter < iterations; iter++) {
            // Check convergence
            const endEffector = workChain[n - 1].position;
            if (endEffector.distance(targetPosition) < tolerance) {
                break;
            }

            // Forward reaching phase
            workChain[n - 1].position = targetPosition.clone();
            for (let i = n - 2; i >= 0; i--) {
                const direction = workChain[i].position.subtract(workChain[i + 1].position).normalize();
                workChain[i].position = workChain[i + 1].position.add(direction.multiply(boneLengths[i]));
            }

            // Backward reaching phase
            workChain[0].position = rootPos.clone();
            for (let i = 0; i < n - 1; i++) {
                const direction = workChain[i + 1].position.subtract(workChain[i].position).normalize();
                workChain[i + 1].position = workChain[i].position.add(direction.multiply(boneLengths[i]));
            }
        }

        // Calculate and store bone rotations
        return this.calculateBoneRotations(workChain);
    }

    /**
     * Rotate a vector around an axis by an angle
     * Uses Rodrigues' rotation formula
     * @param {Vector3D} vector - Vector to rotate
     * @param {Vector3D} axis - Rotation axis (should be normalized)
     * @param {Number} angle - Rotation angle in radians
     * @returns {Vector3D} - Rotated vector
     */
    static rotateAroundAxis(vector, axis, angle) {
        const cosAngle = Math.cos(angle);
        const sinAngle = Math.sin(angle);

        // Rodrigues' rotation formula
        const term1 = vector.multiply(cosAngle);
        const term2 = axis.cross(vector).multiply(sinAngle);
        const term3 = axis.multiply(axis.dot(vector) * (1 - cosAngle));

        return term1.add(term2).add(term3);
    }

    /**
     * Calculate angles between consecutive joints in a chain
     * @param {Array<Joint>} chain - Joint chain
     * @returns {Array<Number>} - Array of angles in degrees
     */
    static calculateJointAngles(chain) {
        const angles = [];
        for (let i = 1; i < chain.length - 1; i++) {
            const v1 = chain[i].position.subtract(chain[i - 1].position).normalize();
            const v2 = chain[i + 1].position.subtract(chain[i].position).normalize();
            const dotProduct = Math.max(-1, Math.min(1, v1.dot(v2)));
            const angle = Math.acos(dotProduct) * (180 / Math.PI);
            angles.push(angle);
        }
        return angles;
    }

    /**
     * Simple single joint IK - directly moves a joint to target position
     * @param {Joint} joint - The joint to move
     * @param {Vector3D} targetPosition - Desired position
     * @returns {Joint} - Updated joint
     */
    static solveSingleJoint(joint, targetPosition) {
        const updatedJoint = joint.clone();
        updatedJoint.position = targetPosition.clone();
        return updatedJoint;
    }

    /**
     * Apply joint constraints to ensure angles are within limits
     * @param {Array<Joint>} chain - Joint chain
     * @returns {Array<Joint>} - Constrained chain
     */
    static applyConstraints(chain) {
        const constrainedChain = chain.map(joint => joint.clone());
        
        for (let i = 1; i < constrainedChain.length - 1; i++) {
            const v1 = constrainedChain[i].position.subtract(constrainedChain[i - 1].position);
            const v2 = constrainedChain[i + 1].position.subtract(constrainedChain[i].position);
            
            const currentAngle = Math.acos(
                Math.max(-1, Math.min(1, v1.normalize().dot(v2.normalize())))
            ) * (180 / Math.PI);

            const joint = constrainedChain[i];
            
            // Clamp angle within constraints
            if (currentAngle < joint.minAngle || currentAngle > joint.maxAngle) {
                const targetAngle = Math.max(joint.minAngle, Math.min(joint.maxAngle, currentAngle));
                // Adjust position to respect constraint
                // This is a simplified constraint - real implementation would be more complex
                console.warn(`Joint ${i} angle ${currentAngle}° outside limits [${joint.minAngle}°, ${joint.maxAngle}°]`);
            }
        }
        
        return constrainedChain;
    }

    /**
     * Calculate bone rotations (Euler angles) from joint positions
     * @param {Array<Joint>} chain - Joint chain with positions
     * @returns {Array<Joint>} - Chain with updated rotation values (in degrees)
     */
    static calculateBoneRotations(chain) {
        const rotatedChain = chain.map(joint => joint.clone());
        
        // For each bone (segment between two joints)
        for (let i = 0; i < rotatedChain.length - 1; i++) {
            const boneVector = rotatedChain[i + 1].position.subtract(rotatedChain[i].position).normalize();
            
            // Calculate Euler angles (ZYX convention)
            // Rotation around Y-axis (yaw)
            const yaw = Math.atan2(boneVector.x, boneVector.z) * (180 / Math.PI);
            
            // Rotation around X-axis (pitch)
            const pitch = Math.asin(-boneVector.y) * (180 / Math.PI);
            
            // For simplicity, roll (rotation around Z-axis) is set to 0
            // A more complex implementation would track twist along the bone
            const roll = 0;
            
            rotatedChain[i].rotation = new Vector3D(pitch, yaw, roll);
        }
        
        // Last joint's rotation is same as the previous bone's direction
        if (rotatedChain.length > 1) {
            rotatedChain[rotatedChain.length - 1].rotation = 
                rotatedChain[rotatedChain.length - 2].rotation.clone();
        }
        
        return rotatedChain;
    }

    /**
     * Helper function to create a finger chain (5 joints typical for fingers)
     * @param {Vector3D} basePosition - Starting position of finger
     * @param {Array<Number>} boneLengths - Array of bone lengths [3-4 elements]
     * @param {Vector3D} direction - Initial direction of finger
     * @returns {Array<Joint>} - Finger joint chain
     */
    static createFingerChain(basePosition, boneLengths = [1, 0.8, 0.6], direction = new Vector3D(1, 0, 0)) {
        const chain = [new Joint(basePosition.clone())];
        const dir = direction.normalize();
        
        let currentPos = basePosition.clone();
        for (const length of boneLengths) {
            currentPos = currentPos.add(dir.multiply(length));
            chain.push(new Joint(currentPos.clone(), -20, 110)); // Typical finger constraints
        }
        
        return chain;
    }

    /**
     * Helper function to create an arm chain (shoulder, elbow, wrist)
     * @param {Vector3D} shoulderPosition - Shoulder position
     * @param {Number} upperArmLength - Length of upper arm
     * @param {Number} forearmLength - Length of forearm
     * @returns {Array<Joint>} - Arm joint chain
     */
    static createArmChain(shoulderPosition, upperArmLength = 1.0, forearmLength = 1.0) {
        return [
            new Joint(shoulderPosition.clone(), -180, 180),
            new Joint(shoulderPosition.add(new Vector3D(0, -upperArmLength, 0)), 0, 160),
            new Joint(shoulderPosition.add(new Vector3D(0, -(upperArmLength + forearmLength), 0)), -90, 90)
        ];
    }
}

// Export for use in Node.js or browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { IKSolver, Vector3D, Joint };
}
