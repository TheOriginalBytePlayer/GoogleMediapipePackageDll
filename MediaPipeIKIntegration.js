/**
 * MediaPipeIKIntegration.js - Example of integrating IK Solver with MediaPipe hand tracking
 * 
 * This demonstrates how to use the IK solver with MediaPipe landmark data
 * to manipulate skeleton positions
 */

const { IKSolver, Vector3D, Joint } = require('./IKSolver.js');

/**
 * Joint angle constraints (in degrees)
 * These represent typical human anatomical limits
 */
const JointConstraints = {
    // Finger joint limits - fingers can curl from slightly backward to fully forward
    MIN_FINGER_ANGLE: -20,  // Slight hyperextension
    MAX_FINGER_ANGLE: 110,  // Full flexion
    
    // Shoulder joint limits - full range of motion
    MIN_SHOULDER_ANGLE: -180,
    MAX_SHOULDER_ANGLE: 180,
    
    // Elbow joint limits - can't bend backward, can bend fully forward
    MIN_ELBOW_ANGLE: 0,     // Fully extended
    MAX_ELBOW_ANGLE: 160,   // Fully flexed
    
    // Wrist joint limits - moderate flexion/extension
    MIN_WRIST_ANGLE: -90,
    MAX_WRIST_ANGLE: 90
};

/**
 * MediaPipe Hand Landmark Indices
 * Reference: https://developers.google.com/mediapipe/solutions/vision/hand_landmarker
 */
const HandLandmarks = {
    WRIST: 0,
    THUMB_CMC: 1,
    THUMB_MCP: 2,
    THUMB_IP: 3,
    THUMB_TIP: 4,
    INDEX_FINGER_MCP: 5,
    INDEX_FINGER_PIP: 6,
    INDEX_FINGER_DIP: 7,
    INDEX_FINGER_TIP: 8,
    MIDDLE_FINGER_MCP: 9,
    MIDDLE_FINGER_PIP: 10,
    MIDDLE_FINGER_DIP: 11,
    MIDDLE_FINGER_TIP: 12,
    RING_FINGER_MCP: 13,
    RING_FINGER_PIP: 14,
    RING_FINGER_DIP: 15,
    RING_FINGER_TIP: 16,
    PINKY_MCP: 17,
    PINKY_PIP: 18,
    PINKY_DIP: 19,
    PINKY_TIP: 20
};

/**
 * MediaPipe Pose Landmark Indices (relevant for arms)
 */
const PoseLandmarks = {
    LEFT_SHOULDER: 11,
    RIGHT_SHOULDER: 12,
    LEFT_ELBOW: 13,
    RIGHT_ELBOW: 14,
    LEFT_WRIST: 15,
    RIGHT_WRIST: 16
};

/**
 * Convert MediaPipe landmark (normalized 0-1 coordinates) to Vector3D
 * @param {Object} landmark - MediaPipe landmark with x, y, z properties
 * @param {Number} scale - Scale factor for converting normalized coords to world coords
 * @returns {Vector3D} - 3D vector in world space
 */
function landmarkToVector3D(landmark, scale = 1.0) {
    return new Vector3D(
        landmark.x * scale,
        landmark.y * scale,
        landmark.z * scale
    );
}

/**
 * Extract a finger chain from MediaPipe hand landmarks
 * @param {Array} landmarks - MediaPipe hand landmarks (21 points)
 * @param {String} fingerName - 'thumb', 'index', 'middle', 'ring', or 'pinky'
 * @param {Number} scale - Scale factor
 * @returns {Array<Joint>} - Joint chain for the finger
 */
function extractFingerChain(landmarks, fingerName, scale = 100) {
    const fingerIndices = {
        'thumb': [HandLandmarks.WRIST, HandLandmarks.THUMB_CMC, HandLandmarks.THUMB_MCP, 
                  HandLandmarks.THUMB_IP, HandLandmarks.THUMB_TIP],
        'index': [HandLandmarks.WRIST, HandLandmarks.INDEX_FINGER_MCP, HandLandmarks.INDEX_FINGER_PIP, 
                  HandLandmarks.INDEX_FINGER_DIP, HandLandmarks.INDEX_FINGER_TIP],
        'middle': [HandLandmarks.WRIST, HandLandmarks.MIDDLE_FINGER_MCP, HandLandmarks.MIDDLE_FINGER_PIP, 
                   HandLandmarks.MIDDLE_FINGER_DIP, HandLandmarks.MIDDLE_FINGER_TIP],
        'ring': [HandLandmarks.WRIST, HandLandmarks.RING_FINGER_MCP, HandLandmarks.RING_FINGER_PIP, 
                 HandLandmarks.RING_FINGER_DIP, HandLandmarks.RING_FINGER_TIP],
        'pinky': [HandLandmarks.WRIST, HandLandmarks.PINKY_MCP, HandLandmarks.PINKY_PIP, 
                  HandLandmarks.PINKY_DIP, HandLandmarks.PINKY_TIP]
    };
    
    const indices = fingerIndices[fingerName.toLowerCase()];
    if (!indices) {
        throw new Error(`Unknown finger name: ${fingerName}`);
    }
    
    return indices.map(idx => {
        const pos = landmarkToVector3D(landmarks[idx], scale);
        return new Joint(pos, JointConstraints.MIN_FINGER_ANGLE, JointConstraints.MAX_FINGER_ANGLE);
    });
}

/**
 * Extract arm chain from MediaPipe pose landmarks
 * @param {Array} landmarks - MediaPipe pose landmarks
 * @param {String} side - 'left' or 'right'
 * @param {Number} scale - Scale factor
 * @returns {Array<Joint>} - Joint chain for the arm
 */
function extractArmChain(landmarks, side = 'left', scale = 100) {
    const shoulderIdx = side === 'left' ? PoseLandmarks.LEFT_SHOULDER : PoseLandmarks.RIGHT_SHOULDER;
    const elbowIdx = side === 'left' ? PoseLandmarks.LEFT_ELBOW : PoseLandmarks.RIGHT_ELBOW;
    const wristIdx = side === 'left' ? PoseLandmarks.LEFT_WRIST : PoseLandmarks.RIGHT_WRIST;
    
    return [
        new Joint(landmarkToVector3D(landmarks[shoulderIdx], scale), 
                  JointConstraints.MIN_SHOULDER_ANGLE, JointConstraints.MAX_SHOULDER_ANGLE),
        new Joint(landmarkToVector3D(landmarks[elbowIdx], scale), 
                  JointConstraints.MIN_ELBOW_ANGLE, JointConstraints.MAX_ELBOW_ANGLE),
        new Joint(landmarkToVector3D(landmarks[wristIdx], scale), 
                  JointConstraints.MIN_WRIST_ANGLE, JointConstraints.MAX_WRIST_ANGLE)
    ];
}

/**
 * Manipulate a finger to reach a new target position
 * @param {Array} landmarks - MediaPipe hand landmarks
 * @param {String} fingerName - Finger to manipulate
 * @param {Vector3D} targetPosition - Desired fingertip position
 * @param {String} algorithm - 'ccd' or 'fabrik'
 * @returns {Array<Joint>} - Solved joint chain
 */
function manipulateFinger(landmarks, fingerName, targetPosition, algorithm = 'fabrik') {
    // Extract the current finger chain from MediaPipe data
    const fingerChain = extractFingerChain(landmarks, fingerName);
    
    console.log(`\nManipulating ${fingerName} finger:`);
    console.log(`Current tip position: (${fingerChain[fingerChain.length-1].position.x.toFixed(2)}, ` +
                `${fingerChain[fingerChain.length-1].position.y.toFixed(2)}, ` +
                `${fingerChain[fingerChain.length-1].position.z.toFixed(2)})`);
    console.log(`Target position: (${targetPosition.x.toFixed(2)}, ${targetPosition.y.toFixed(2)}, ${targetPosition.z.toFixed(2)})`);
    
    // Solve IK
    const solved = algorithm === 'ccd' 
        ? IKSolver.solveCCD(fingerChain, targetPosition, 15, 0.01)
        : IKSolver.solveFABRIK(fingerChain, targetPosition, 15, 0.01);
    
    // Report results
    const distance = solved[solved.length-1].position.distance(targetPosition);
    console.log(`Solved with ${algorithm.toUpperCase()}, distance to target: ${distance.toFixed(4)}`);
    console.log(`New tip position: (${solved[solved.length-1].position.x.toFixed(2)}, ` +
                `${solved[solved.length-1].position.y.toFixed(2)}, ` +
                `${solved[solved.length-1].position.z.toFixed(2)})`);
    console.log(`New tip rotation: (${solved[solved.length-1].rotation.x.toFixed(2)}°, ` +
                `${solved[solved.length-1].rotation.y.toFixed(2)}°, ` +
                `${solved[solved.length-1].rotation.z.toFixed(2)}°)`);
    
    return solved;
}

/**
 * Manipulate an arm to reach a new target position
 * @param {Array} landmarks - MediaPipe pose landmarks
 * @param {String} side - 'left' or 'right'
 * @param {Vector3D} targetPosition - Desired wrist position
 * @param {String} algorithm - 'ccd' or 'fabrik'
 * @returns {Array<Joint>} - Solved joint chain
 */
function manipulateArm(landmarks, side, targetPosition, algorithm = 'fabrik') {
    // Extract the current arm chain from MediaPipe data
    const armChain = extractArmChain(landmarks, side);
    
    console.log(`\nManipulating ${side} arm:`);
    console.log(`Current wrist position: (${armChain[armChain.length-1].position.x.toFixed(2)}, ` +
                `${armChain[armChain.length-1].position.y.toFixed(2)}, ` +
                `${armChain[armChain.length-1].position.z.toFixed(2)})`);
    console.log(`Target position: (${targetPosition.x.toFixed(2)}, ${targetPosition.y.toFixed(2)}, ${targetPosition.z.toFixed(2)})`);
    
    // Solve IK
    const solved = algorithm === 'ccd'
        ? IKSolver.solveCCD(armChain, targetPosition, 20, 0.01)
        : IKSolver.solveFABRIK(armChain, targetPosition, 20, 0.01);
    
    // Report results
    const distance = solved[solved.length-1].position.distance(targetPosition);
    console.log(`Solved with ${algorithm.toUpperCase()}, distance to target: ${distance.toFixed(4)}`);
    console.log(`New wrist position: (${solved[solved.length-1].position.x.toFixed(2)}, ` +
                `${solved[solved.length-1].position.y.toFixed(2)}, ` +
                `${solved[solved.length-1].position.z.toFixed(2)})`);
    console.log(`New wrist rotation: (${solved[solved.length-1].rotation.x.toFixed(2)}°, ` +
                `${solved[solved.length-1].rotation.y.toFixed(2)}°, ` +
                `${solved[solved.length-1].rotation.z.toFixed(2)}°)`);
    
    return solved;
}

/**
 * Create simulated MediaPipe hand landmarks for demo purposes
 * In real usage, these would come from MediaPipe hand tracking
 * @returns {Array} Array of 21 hand landmarks with normalized coordinates (0-1)
 */
function createSimulatedHandLandmarks() {
    // Hand landmarks in a neutral open hand pose
    return [
        { x: 0.5, y: 0.5, z: 0 },     // 0: WRIST
        { x: 0.45, y: 0.48, z: 0.01 }, // 1: THUMB_CMC
        { x: 0.42, y: 0.45, z: 0.02 }, // 2: THUMB_MCP
        { x: 0.40, y: 0.42, z: 0.03 }, // 3: THUMB_IP
        { x: 0.38, y: 0.39, z: 0.04 }, // 4: THUMB_TIP
        { x: 0.52, y: 0.45, z: 0 },    // 5: INDEX_MCP
        { x: 0.53, y: 0.40, z: 0 },    // 6: INDEX_PIP
        { x: 0.54, y: 0.36, z: 0 },    // 7: INDEX_DIP
        { x: 0.55, y: 0.33, z: 0 },    // 8: INDEX_TIP
        { x: 0.54, y: 0.45, z: 0 },    // 9: MIDDLE_MCP
        { x: 0.55, y: 0.39, z: 0 },    // 10: MIDDLE_PIP
        { x: 0.56, y: 0.34, z: 0 },    // 11: MIDDLE_DIP
        { x: 0.57, y: 0.30, z: 0 },    // 12: MIDDLE_TIP
        { x: 0.56, y: 0.45, z: 0 },    // 13: RING_MCP
        { x: 0.57, y: 0.40, z: 0 },    // 14: RING_PIP
        { x: 0.58, y: 0.36, z: 0 },    // 15: RING_DIP
        { x: 0.59, y: 0.33, z: 0 },    // 16: RING_TIP
        { x: 0.58, y: 0.46, z: 0 },    // 17: PINKY_MCP
        { x: 0.59, y: 0.42, z: 0 },    // 18: PINKY_PIP
        { x: 0.60, y: 0.39, z: 0 },    // 19: PINKY_DIP
        { x: 0.61, y: 0.37, z: 0 }     // 20: PINKY_TIP
    ];
}

/**
 * Create simulated MediaPipe pose landmarks for demo purposes
 * In real usage, these would come from MediaPipe pose tracking
 * @returns {Array} Sparse array of pose landmarks with normalized coordinates (0-1)
 */
function createSimulatedPoseLandmarks() {
    const landmarks = [];
    landmarks[PoseLandmarks.LEFT_SHOULDER] = { x: 0.4, y: 0.3, z: 0 };
    landmarks[PoseLandmarks.LEFT_ELBOW] = { x: 0.45, y: 0.5, z: 0 };
    landmarks[PoseLandmarks.LEFT_WRIST] = { x: 0.5, y: 0.7, z: 0 };
    return landmarks;
}

// ================= DEMO WITH SIMULATED MEDIAPIPE DATA =================

console.log("=== MediaPipe IK Integration Demo ===\n");

const simulatedHandLandmarks = createSimulatedHandLandmarks();
const simulatedPoseLandmarks = createSimulatedPoseLandmarks();

// Example 1: Move index finger to a new position
const indexTargetPosition = new Vector3D(60, 25, 5);
const solvedIndexFinger = manipulateFinger(
    simulatedHandLandmarks, 
    'index', 
    indexTargetPosition, 
    'fabrik'
);

// Example 2: Move middle finger
const middleTargetPosition = new Vector3D(62, 22, 3);
manipulateFinger(simulatedHandLandmarks, 'middle', middleTargetPosition, 'ccd');

// Example 3: Move left arm to reach a target
const armTargetPosition = new Vector3D(55, 65, -5);
const solvedArm = manipulateArm(simulatedPoseLandmarks, 'left', armTargetPosition, 'fabrik');

console.log("\n=== Integration Complete ===");
console.log("\nUsage in your application:");
console.log("1. Get landmarks from MediaPipe tracking");
console.log("2. Call extractFingerChain() or extractArmChain() to build joint chains");
console.log("3. Define target position where you want the end effector to move");
console.log("4. Call manipulateFinger() or manipulateArm() to solve IK");
console.log("5. Use the solved joint positions to update your 3D model or animation");

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        JointConstraints,
        HandLandmarks,
        PoseLandmarks,
        landmarkToVector3D,
        extractFingerChain,
        extractArmChain,
        manipulateFinger,
        manipulateArm,
        createSimulatedHandLandmarks,
        createSimulatedPoseLandmarks
    };
}
