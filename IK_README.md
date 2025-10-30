# IK Solver - Inverse Kinematics Solution for Skeleton Manipulation

This package provides a complete Inverse Kinematics (IK) solution for moving hands, arms, and fingers of a skeleton by supplying the current 3D position of a joint and a new 3D position for that joint.

## Overview

Inverse Kinematics (IK) is the process of determining the joint angles/positions needed to place an end effector (like a hand or fingertip) at a desired location. This is essential for realistic skeleton animation and motion control.

## Features

- **Two IK Algorithms**: 
  - CCD (Cyclic Coordinate Descent) - Fast and intuitive
  - FABRIK (Forward And Backward Reaching Inverse Kinematics) - More accurate and natural-looking

- **Support for Multiple Joint Chains**:
  - Arms (shoulder, elbow, wrist)
  - Fingers (multiple phalanges)
  - Custom joint chains

- **Joint Constraints**: Define minimum and maximum angle limits for realistic motion

- **3D Vector Math**: Complete vector operations for 3D space manipulation

- **Two Implementations**:
  - JavaScript (for web/Node.js applications)
  - Delphi Pascal (for native Windows applications)

## Files Included

- `IKSolver.js` - JavaScript implementation
- `IKSolver.pas` - Delphi Pascal implementation
- `IKSolverExample.js` - JavaScript usage examples
- `IKSolverExample.pas` - Delphi Pascal usage examples
- `IK_README.md` - This documentation

## Quick Start

### JavaScript Usage

```javascript
// Import the solver
const { IKSolver, Vector3D, Joint } = require('./IKSolver.js');

// Create an arm chain
const shoulderPos = new Vector3D(0, 0, 0);
const armChain = IKSolver.createArmChain(shoulderPos, 1.0, 0.9);

// Define target position for the hand
const targetHandPosition = new Vector3D(0.8, -1.5, 0.3);

// Solve using FABRIK algorithm
const solvedArm = IKSolver.solveFABRIK(armChain, targetHandPosition, 20, 0.01);

// Access the solved joint positions
solvedArm.forEach((joint, i) => {
    console.log(`Joint ${i}: (${joint.position.x}, ${joint.position.y}, ${joint.position.z})`);
});
```

### Delphi Pascal Usage

```pascal
uses
  IKSolver;

var
  ShoulderPos, TargetPosition: TVector3D;
  ArmChain, SolvedArm: TJointArray;
  I: Integer;
begin
  // Create an arm chain
  ShoulderPos := TVector3D.Create(0, 0, 0);
  ArmChain := TIKSolver.CreateArmChain(ShoulderPos, 1.0, 0.9);
  
  // Define target position
  TargetPosition := TVector3D.Create(0.8, -1.5, 0.3);
  
  // Solve using FABRIK algorithm
  SolvedArm := TIKSolver.SolveFABRIK(ArmChain, TargetPosition, 20, 0.01);
  
  // Access solved joint positions
  for I := 0 to High(SolvedArm) do
    WriteLn(Format('Joint %d: (%.2f, %.2f, %.2f)', 
      [I, SolvedArm[I].Position.X, SolvedArm[I].Position.Y, SolvedArm[I].Position.Z]));
end;
```

## API Reference

### Core Classes/Types

#### Vector3D
Represents a 3D point or vector in space.

**JavaScript:**
```javascript
const v = new Vector3D(x, y, z);
```

**Delphi:**
```pascal
var V: TVector3D;
V := TVector3D.Create(X, Y, Z);
```

**Methods:**
- `add(v)` / `Add(V)` - Vector addition
- `subtract(v)` / `Subtract(V)` - Vector subtraction
- `multiply(scalar)` / `Multiply(Scalar)` - Scalar multiplication
- `divide(scalar)` / `Divide(Scalar)` - Scalar division
- `magnitude()` / `Magnitude` - Vector length
- `normalize()` / `Normalize` - Get unit vector
- `dot(v)` / `Dot(V)` - Dot product
- `cross(v)` / `Cross(V)` - Cross product
- `distance(v)` / `Distance(V)` - Distance to another vector

#### Joint
Represents a joint in a kinematic chain.

**JavaScript:**
```javascript
const joint = new Joint(position, minAngle, maxAngle);
```

**Delphi:**
```pascal
var Joint: TJoint;
Joint := TJoint.Create(Position, MinAngle, MaxAngle);
```

**Properties:**
- `position` / `Position` - 3D position of the joint
- `minAngle` / `MinAngle` - Minimum angle constraint (degrees)
- `maxAngle` / `MaxAngle` - Maximum angle constraint (degrees)

### IK Solver Methods

#### solveCCD / SolveCCD
Solve IK using the Cyclic Coordinate Descent algorithm.

**JavaScript:**
```javascript
IKSolver.solveCCD(chain, targetPosition, iterations = 10, tolerance = 0.01)
```

**Delphi:**
```pascal
TIKSolver.SolveCCD(Chain, TargetPosition, Iterations, Tolerance)
```

**Parameters:**
- `chain` - Array of joints from root to end effector
- `targetPosition` - Desired position for end effector
- `iterations` - Maximum iterations (default: 10)
- `tolerance` - Distance tolerance for convergence (default: 0.01)

**Returns:** Updated joint chain

**Algorithm Characteristics:**
- Fast convergence
- Good for simple chains
- May produce less natural-looking results for complex chains

#### solveFABRIK / SolveFABRIK
Solve IK using the Forward And Backward Reaching Inverse Kinematics algorithm.

**JavaScript:**
```javascript
IKSolver.solveFABRIK(chain, targetPosition, iterations = 10, tolerance = 0.01)
```

**Delphi:**
```pascal
TIKSolver.SolveFABRIK(Chain, TargetPosition, Iterations, Tolerance)
```

**Parameters:** Same as CCD

**Returns:** Updated joint chain

**Algorithm Characteristics:**
- More accurate
- Natural-looking motion
- Better for complex chains
- Slightly slower than CCD

#### solveSingleJoint / SolveSingleJoint
Directly move a single joint to a target position (no IK calculation needed).

**JavaScript:**
```javascript
IKSolver.solveSingleJoint(joint, targetPosition)
```

**Delphi:**
```pascal
TIKSolver.SolveSingleJoint(Joint, TargetPosition)
```

#### calculateJointAngles / CalculateJointAngles
Calculate the angles between consecutive joints in a chain.

**JavaScript:**
```javascript
const angles = IKSolver.calculateJointAngles(chain);
```

**Delphi:**
```pascal
var Angles: TArray<Double>;
Angles := TIKSolver.CalculateJointAngles(Chain);
```

**Returns:** Array of angles in degrees

#### applyConstraints / ApplyConstraints
Apply joint angle constraints to ensure realistic motion.

**JavaScript:**
```javascript
const constrainedChain = IKSolver.applyConstraints(chain);
```

**Delphi:**
```pascal
var ConstrainedChain: TJointArray;
ConstrainedChain := TIKSolver.ApplyConstraints(Chain);
```

### Helper Functions

#### createFingerChain / CreateFingerChain
Create a finger joint chain with typical finger proportions.

**JavaScript:**
```javascript
const fingerChain = IKSolver.createFingerChain(
    basePosition, 
    [0.4, 0.3, 0.25],  // bone lengths
    new Vector3D(1, 0, 0)  // direction
);
```

**Delphi:**
```pascal
var BoneLengths: TArray<Double>;
    FingerChain: TJointArray;
SetLength(BoneLengths, 3);
BoneLengths[0] := 0.4;
BoneLengths[1] := 0.3;
BoneLengths[2] := 0.25;
FingerChain := TIKSolver.CreateFingerChain(BasePosition, BoneLengths, Direction);
```

#### createArmChain / CreateArmChain
Create a 3-joint arm chain (shoulder, elbow, wrist).

**JavaScript:**
```javascript
const armChain = IKSolver.createArmChain(
    shoulderPosition,
    1.0,  // upper arm length
    0.9   // forearm length
);
```

**Delphi:**
```pascal
var ArmChain: TJointArray;
ArmChain := TIKSolver.CreateArmChain(ShoulderPosition, 1.0, 0.9);
```

## Examples

### Example 1: Moving a Hand to a Target

```javascript
// JavaScript
const shoulder = new Vector3D(0, 0, 0);
const arm = IKSolver.createArmChain(shoulder, 1.0, 0.9);
const target = new Vector3D(1.2, -1.0, -0.5);
const solved = IKSolver.solveFABRIK(arm, target);
```

```pascal
// Delphi
var
  Shoulder, Target: TVector3D;
  Arm, Solved: TJointArray;
begin
  Shoulder := TVector3D.Create(0, 0, 0);
  Arm := TIKSolver.CreateArmChain(Shoulder, 1.0, 0.9);
  Target := TVector3D.Create(1.2, -1.0, -0.5);
  Solved := TIKSolver.SolveFABRIK(Arm, Target);
end;
```

### Example 2: Moving a Finger

```javascript
// JavaScript
const fingerBase = new Vector3D(0, 0, 0);
const finger = IKSolver.createFingerChain(
    fingerBase, 
    [0.4, 0.3, 0.25], 
    new Vector3D(1, 0, 0)
);
const tipTarget = new Vector3D(0.7, 0.5, 0.2);
const solvedFinger = IKSolver.solveFABRIK(finger, tipTarget, 15, 0.01);
```

```pascal
// Delphi
var
  FingerBase, Direction, TipTarget: TVector3D;
  BoneLengths: TArray<Double>;
  Finger, SolvedFinger: TJointArray;
begin
  FingerBase := TVector3D.Create(0, 0, 0);
  Direction := TVector3D.Create(1, 0, 0);
  SetLength(BoneLengths, 3);
  BoneLengths[0] := 0.4;
  BoneLengths[1] := 0.3;
  BoneLengths[2] := 0.25;
  Finger := TIKSolver.CreateFingerChain(FingerBase, BoneLengths, Direction);
  TipTarget := TVector3D.Create(0.7, 0.5, 0.2);
  SolvedFinger := TIKSolver.SolveFABRIK(Finger, TipTarget, 15, 0.01);
end;
```

### Example 3: Full Hand with Multiple Fingers

```javascript
// JavaScript
const handBase = new Vector3D(0, 0, 0);
const fingerOffsets = [
    new Vector3D(-0.3, 0, 0.2),   // Thumb
    new Vector3D(-0.15, 0, 0),    // Index
    new Vector3D(0, 0, 0),        // Middle
    new Vector3D(0.15, 0, 0),     // Ring
    new Vector3D(0.3, 0, -0.1)    // Pinky
];

const fingers = fingerOffsets.map(offset => {
    const basePos = handBase.add(offset);
    return IKSolver.createFingerChain(basePos, [0.4, 0.3, 0.25], new Vector3D(1, 0, 0));
});

// Define targets for making a fist
const targets = [
    new Vector3D(0.3, 0.5, 0.3),
    new Vector3D(0.5, 0.4, 0.1),
    new Vector3D(0.6, 0.3, 0.0),
    new Vector3D(0.5, 0.3, -0.1),
    new Vector3D(0.4, 0.2, -0.2)
];

// Solve IK for each finger
const solvedFingers = fingers.map((finger, i) => 
    IKSolver.solveFABRIK(finger, targets[i], 15, 0.01)
);
```

## Running the Examples

### JavaScript

```bash
# In a browser (include IKSolver.js first)
<script src="IKSolver.js"></script>
<script src="IKSolverExample.js"></script>

# Or in Node.js
node IKSolverExample.js
```

### Delphi Pascal

```bash
# Compile with Delphi
dcc32 IKSolverExample.pas

# Or use your Delphi IDE
# File > Open Project > IKSolverExample.dpr
# Run > Run (F9)
```

## Algorithm Details

### CCD (Cyclic Coordinate Descent)

The CCD algorithm works by iterating through each joint in the chain (from end to root) and rotating it to point the end effector closer to the target. This process repeats until the end effector reaches the target or maximum iterations are reached.

**Advantages:**
- Simple to understand and implement
- Fast convergence for simple chains
- Low computational cost

**Disadvantages:**
- May produce unnatural-looking motion
- Can get stuck in local minima
- Less accurate for complex chains

### FABRIK (Forward And Backward Reaching Inverse Kinematics)

FABRIK works in two phases:
1. **Forward Phase**: Start from the end effector (set to target) and work backward to the root, adjusting each joint while maintaining bone lengths
2. **Backward Phase**: Start from the root (restored to original position) and work forward to the end effector, again maintaining bone lengths

This process repeats until convergence.

**Advantages:**
- More natural-looking motion
- Better accuracy
- Handles complex chains well
- No singularities

**Disadvantages:**
- Slightly more computationally expensive than CCD
- Requires more iterations for convergence

## Integration with MediaPipe

This IK solver can be used with MediaPipe hand/pose tracking data. MediaPipe provides the current 3D positions of joints, and this IK solver can calculate new positions when you want to manipulate or adjust the skeleton.

Example workflow:
1. Get joint positions from MediaPipe (current state)
2. Define desired target position for end effector (e.g., fingertip, wrist)
3. Use IK solver to calculate intermediate joint positions
4. Apply the solved positions to your 3D model or animation

## Performance Considerations

- **Iterations**: More iterations = more accurate but slower. Start with 10-20.
- **Tolerance**: Smaller tolerance = more accurate but may require more iterations. 0.01 is usually sufficient.
- **Chain Length**: Longer chains require more computation. Consider breaking very long chains into smaller segments.
- **Algorithm Choice**: Use FABRIK for accuracy, CCD for speed.

## Limitations and Future Enhancements

Current limitations:
- Joint constraints are basic (angle limits are checked but not strictly enforced in all cases)
- No collision detection
- No support for closed kinematic chains
- Rotation limits are simplified

Potential enhancements:
- Advanced constraint handling (ball-and-socket, hinge joints)
- Collision avoidance
- Support for multiple end effectors
- Weight-based IK solving
- Performance optimizations

## License

This IK solver is provided as part of the GoogleMediapipePackageDll project. Please refer to the main project LICENSE file for licensing information.

## Contributing

Contributions are welcome! Areas for improvement:
- Better constraint handling
- Additional IK algorithms (Jacobian-based, etc.)
- Performance optimizations
- More examples and use cases
- Unit tests

## References

- [FABRIK: A Fast, Iterative Solver for the Inverse Kinematics Problem](http://www.andreasaristidou.com/FABRIK.html)
- [Inverse Kinematics - Wikipedia](https://en.wikipedia.org/wiki/Inverse_kinematics)
- [CCD Algorithm Tutorial](http://theorangeduck.com/page/simple-two-joint)

## Support

For issues, questions, or contributions related to the IK solver, please open an issue in the main repository.
