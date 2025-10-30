/**
 * IKSolverExample.js - Example usage of the IK Solver for skeleton manipulation
 * 
 * This demonstrates how to use the IK solver to move hands, arms, and fingers
 * by supplying current and target 3D positions
 */

// Import the IK Solver
const { IKSolver, Vector3D, Joint } = require('./IKSolver.js');

console.log("=== IK Solver Examples ===\n");

// Example 1: Simple Single Joint Movement
console.log("Example 1: Moving a single joint");
console.log("---------------------------------");
const wrist = new Joint(new Vector3D(0, -2, 0));
const currentPosition = wrist.position;
const targetPosition = new Vector3D(1, -1.5, 0.5);

console.log(`Current wrist position: (${currentPosition.x}, ${currentPosition.y}, ${currentPosition.z})`);
console.log(`Target position: (${targetPosition.x}, ${targetPosition.y}, ${targetPosition.z})`);

const newWrist = IKSolver.solveSingleJoint(wrist, targetPosition);
console.log(`New wrist position: (${newWrist.position.x}, ${newWrist.position.y}, ${newWrist.position.z})`);
console.log();

// Example 2: Arm IK using CCD Algorithm
console.log("Example 2: Moving an arm to reach a target (CCD Algorithm)");
console.log("-----------------------------------------------------------");
const shoulderPos = new Vector3D(0, 0, 0);
const armChain = IKSolver.createArmChain(shoulderPos, 1.0, 0.9);

console.log("Initial arm chain:");
armChain.forEach((joint, i) => {
    console.log(`  Joint ${i}: (${joint.position.x.toFixed(2)}, ${joint.position.y.toFixed(2)}, ${joint.position.z.toFixed(2)})`);
});

const targetHandPosition = new Vector3D(0.8, -1.5, 0.3);
console.log(`\nTarget hand position: (${targetHandPosition.x}, ${targetHandPosition.y}, ${targetHandPosition.z})`);

const solvedArmCCD = IKSolver.solveCCD(armChain, targetHandPosition, 20, 0.01);

console.log("\nArm chain after CCD IK:");
solvedArmCCD.forEach((joint, i) => {
    console.log(`  Joint ${i}: (${joint.position.x.toFixed(2)}, ${joint.position.y.toFixed(2)}, ${joint.position.z.toFixed(2)})`);
});

const endEffectorDistance = solvedArmCCD[solvedArmCCD.length - 1].position.distance(targetHandPosition);
console.log(`\nDistance to target: ${endEffectorDistance.toFixed(4)}`);
console.log();

// Example 3: Arm IK using FABRIK Algorithm
console.log("Example 3: Moving an arm to reach a target (FABRIK Algorithm)");
console.log("--------------------------------------------------------------");
const armChain2 = IKSolver.createArmChain(shoulderPos, 1.0, 0.9);

console.log("Initial arm chain:");
armChain2.forEach((joint, i) => {
    console.log(`  Joint ${i}: (${joint.position.x.toFixed(2)}, ${joint.position.y.toFixed(2)}, ${joint.position.z.toFixed(2)})`);
});

const targetHandPosition2 = new Vector3D(1.2, -1.0, -0.5);
console.log(`\nTarget hand position: (${targetHandPosition2.x}, ${targetHandPosition2.y}, ${targetHandPosition2.z})`);

const solvedArmFABRIK = IKSolver.solveFABRIK(armChain2, targetHandPosition2, 20, 0.01);

console.log("\nArm chain after FABRIK IK:");
solvedArmFABRIK.forEach((joint, i) => {
    console.log(`  Joint ${i}: (${joint.position.x.toFixed(2)}, ${joint.position.y.toFixed(2)}, ${joint.position.z.toFixed(2)})`);
});

const endEffectorDistance2 = solvedArmFABRIK[solvedArmFABRIK.length - 1].position.distance(targetHandPosition2);
console.log(`\nDistance to target: ${endEffectorDistance2.toFixed(4)}`);
console.log();

// Example 4: Finger IK
console.log("Example 4: Moving a finger to a target position");
console.log("------------------------------------------------");
const fingerBase = new Vector3D(0, 0, 0);
const fingerDirection = new Vector3D(1, 0, 0);
const fingerBoneLengths = [0.4, 0.3, 0.25]; // Proximal, middle, distal phalanges

const fingerChain = IKSolver.createFingerChain(fingerBase, fingerBoneLengths, fingerDirection);

console.log("Initial finger chain:");
fingerChain.forEach((joint, i) => {
    console.log(`  Joint ${i}: (${joint.position.x.toFixed(2)}, ${joint.position.y.toFixed(2)}, ${joint.position.z.toFixed(2)})`);
});

const targetFingerTip = new Vector3D(0.7, 0.5, 0.2);
console.log(`\nTarget finger tip position: (${targetFingerTip.x}, ${targetFingerTip.y}, ${targetFingerTip.z})`);

const solvedFinger = IKSolver.solveFABRIK(fingerChain, targetFingerTip, 15, 0.01);

console.log("\nFinger chain after IK:");
solvedFinger.forEach((joint, i) => {
    console.log(`  Joint ${i}: (${joint.position.x.toFixed(2)}, ${joint.position.y.toFixed(2)}, ${joint.position.z.toFixed(2)})`);
});

const fingerDistance = solvedFinger[solvedFinger.length - 1].position.distance(targetFingerTip);
console.log(`\nDistance to target: ${fingerDistance.toFixed(4)}`);
console.log();

// Example 5: Calculate Joint Angles
console.log("Example 5: Calculating joint angles");
console.log("------------------------------------");
const angles = IKSolver.calculateJointAngles(solvedArmCCD);
console.log("Joint angles in the solved arm chain:");
angles.forEach((angle, i) => {
    console.log(`  Joint ${i + 1} angle: ${angle.toFixed(2)}°`);
});
console.log();

// Example 6: Multiple Fingers (Hand)
console.log("Example 6: Moving multiple fingers on a hand");
console.log("---------------------------------------------");
const handBase = new Vector3D(0, 0, 0);
const fingers = [];
const fingerNames = ['Thumb', 'Index', 'Middle', 'Ring', 'Pinky'];
const fingerOffsets = [
    new Vector3D(-0.3, 0, 0.2),
    new Vector3D(-0.15, 0, 0),
    new Vector3D(0, 0, 0),
    new Vector3D(0.15, 0, 0),
    new Vector3D(0.3, 0, -0.1)
];

// Create finger chains
for (let i = 0; i < 5; i++) {
    const basePos = handBase.add(fingerOffsets[i]);
    const chain = IKSolver.createFingerChain(basePos, [0.4, 0.3, 0.25], new Vector3D(1, 0, 0));
    fingers.push({ name: fingerNames[i], chain: chain });
}

// Define target positions for each finger (e.g., making a fist)
const fingerTargets = [
    new Vector3D(0.3, 0.5, 0.3),   // Thumb
    new Vector3D(0.5, 0.4, 0.1),   // Index
    new Vector3D(0.6, 0.3, 0.0),   // Middle
    new Vector3D(0.5, 0.3, -0.1),  // Ring
    new Vector3D(0.4, 0.2, -0.2)   // Pinky
];

console.log("Solving IK for all fingers:");
fingers.forEach((finger, i) => {
    const solved = IKSolver.solveFABRIK(finger.chain, fingerTargets[i], 15, 0.01);
    const tipPos = solved[solved.length - 1].position;
    const distance = tipPos.distance(fingerTargets[i]);
    console.log(`  ${finger.name}: Target distance = ${distance.toFixed(4)}`);
});
console.log();

console.log("=== Examples Complete ===");
