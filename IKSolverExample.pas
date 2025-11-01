program IKSolverExample;

{$APPTYPE CONSOLE}

{*******************************************************************************
  IKSolverExample - Example usage of the IK Solver for skeleton manipulation
  
  This demonstrates how to use the IK solver to move hands, arms, and fingers
  by supplying current and target 3D positions
*******************************************************************************}

uses
  System.SysUtils,
  IKSolver in 'IKSolver.pas';

procedure Example1_SimpleSingleJoint;
var
  Wrist, NewWrist: TJoint;
  CurrentPosition, TargetPosition: TVector3D;
begin
  WriteLn('Example 1: Moving a single joint');
  WriteLn('---------------------------------');
  
  CurrentPosition := TVector3D.Create(0, -2, 0);
  Wrist := TJoint.Create(CurrentPosition);
  TargetPosition := TVector3D.Create(1, -1.5, 0.5);
  
  WriteLn(Format('Current wrist position: (%.2f, %.2f, %.2f)', 
    [CurrentPosition.X, CurrentPosition.Y, CurrentPosition.Z]));
  WriteLn(Format('Target position: (%.2f, %.2f, %.2f)', 
    [TargetPosition.X, TargetPosition.Y, TargetPosition.Z]));
  
  NewWrist := TIKSolver.SolveSingleJoint(Wrist, TargetPosition);
  WriteLn(Format('New wrist position: (%.2f, %.2f, %.2f)', 
    [NewWrist.Position.X, NewWrist.Position.Y, NewWrist.Position.Z]));
  WriteLn;
end;

procedure Example2_ArmIKWithCCD;
var
  ShoulderPos, TargetHandPosition: TVector3D;
  ArmChain, SolvedArmCCD: TJointArray;
  I: Integer;
  EndEffectorDistance: Double;
begin
  WriteLn('Example 2: Moving an arm to reach a target (CCD Algorithm)');
  WriteLn('-----------------------------------------------------------');
  
  ShoulderPos := TVector3D.Create(0, 0, 0);
  ArmChain := TIKSolver.CreateArmChain(ShoulderPos, 1.0, 0.9);
  
  WriteLn('Initial arm chain:');
  for I := 0 to High(ArmChain) do
    WriteLn(Format('  Joint %d: (%.2f, %.2f, %.2f)', 
      [I, ArmChain[I].Position.X, ArmChain[I].Position.Y, ArmChain[I].Position.Z]));
  
  TargetHandPosition := TVector3D.Create(0.8, -1.5, 0.3);
  WriteLn(Format(#13#10'Target hand position: (%.2f, %.2f, %.2f)', 
    [TargetHandPosition.X, TargetHandPosition.Y, TargetHandPosition.Z]));
  
  SolvedArmCCD := TIKSolver.SolveCCD(ArmChain, TargetHandPosition, 20, 0.01);
  
  WriteLn(#13#10'Arm chain after CCD IK:');
  for I := 0 to High(SolvedArmCCD) do
  begin
    WriteLn(Format('  Joint %d:', [I]));
    WriteLn(Format('    Position: (%.2f, %.2f, %.2f)', 
      [SolvedArmCCD[I].Position.X, SolvedArmCCD[I].Position.Y, SolvedArmCCD[I].Position.Z]));
    WriteLn(Format('    Rotation: (%.2f°, %.2f°, %.2f°)', 
      [SolvedArmCCD[I].Rotation.X, SolvedArmCCD[I].Rotation.Y, SolvedArmCCD[I].Rotation.Z]));
  end;
  
  EndEffectorDistance := SolvedArmCCD[High(SolvedArmCCD)].Position.Distance(TargetHandPosition);
  WriteLn(Format(#13#10'Distance to target: %.4f', [EndEffectorDistance]));
  WriteLn;
end;

procedure Example3_ArmIKWithFABRIK;
var
  ShoulderPos, TargetHandPosition: TVector3D;
  ArmChain, SolvedArmFABRIK: TJointArray;
  I: Integer;
  EndEffectorDistance: Double;
begin
  WriteLn('Example 3: Moving an arm to reach a target (FABRIK Algorithm)');
  WriteLn('--------------------------------------------------------------');
  
  ShoulderPos := TVector3D.Create(0, 0, 0);
  ArmChain := TIKSolver.CreateArmChain(ShoulderPos, 1.0, 0.9);
  
  WriteLn('Initial arm chain:');
  for I := 0 to High(ArmChain) do
    WriteLn(Format('  Joint %d: (%.2f, %.2f, %.2f)', 
      [I, ArmChain[I].Position.X, ArmChain[I].Position.Y, ArmChain[I].Position.Z]));
  
  TargetHandPosition := TVector3D.Create(1.2, -1.0, -0.5);
  WriteLn(Format(#13#10'Target hand position: (%.2f, %.2f, %.2f)', 
    [TargetHandPosition.X, TargetHandPosition.Y, TargetHandPosition.Z]));
  
  SolvedArmFABRIK := TIKSolver.SolveFABRIK(ArmChain, TargetHandPosition, 20, 0.01);
  
  WriteLn(#13#10'Arm chain after FABRIK IK:');
  for I := 0 to High(SolvedArmFABRIK) do
  begin
    WriteLn(Format('  Joint %d:', [I]));
    WriteLn(Format('    Position: (%.2f, %.2f, %.2f)', 
      [SolvedArmFABRIK[I].Position.X, SolvedArmFABRIK[I].Position.Y, SolvedArmFABRIK[I].Position.Z]));
    WriteLn(Format('    Rotation: (%.2f°, %.2f°, %.2f°)', 
      [SolvedArmFABRIK[I].Rotation.X, SolvedArmFABRIK[I].Rotation.Y, SolvedArmFABRIK[I].Rotation.Z]));
  end;
  
  EndEffectorDistance := SolvedArmFABRIK[High(SolvedArmFABRIK)].Position.Distance(TargetHandPosition);
  WriteLn(Format(#13#10'Distance to target: %.4f', [EndEffectorDistance]));
  WriteLn;
end;

procedure Example4_FingerIK;
var
  FingerBase, FingerDirection, TargetFingerTip: TVector3D;
  FingerBoneLengths: TArray<Double>;
  FingerChain, SolvedFinger: TJointArray;
  I: Integer;
  FingerDistance: Double;
begin
  WriteLn('Example 4: Moving a finger to a target position');
  WriteLn('------------------------------------------------');
  
  FingerBase := TVector3D.Create(0, 0, 0);
  FingerDirection := TVector3D.Create(1, 0, 0);
  SetLength(FingerBoneLengths, 3);
  FingerBoneLengths[0] := 0.4;
  FingerBoneLengths[1] := 0.3;
  FingerBoneLengths[2] := 0.25;
  
  FingerChain := TIKSolver.CreateFingerChain(FingerBase, FingerBoneLengths, FingerDirection);
  
  WriteLn('Initial finger chain:');
  for I := 0 to High(FingerChain) do
    WriteLn(Format('  Joint %d: (%.2f, %.2f, %.2f)', 
      [I, FingerChain[I].Position.X, FingerChain[I].Position.Y, FingerChain[I].Position.Z]));
  
  TargetFingerTip := TVector3D.Create(0.7, 0.5, 0.2);
  WriteLn(Format(#13#10'Target finger tip position: (%.2f, %.2f, %.2f)', 
    [TargetFingerTip.X, TargetFingerTip.Y, TargetFingerTip.Z]));
  
  SolvedFinger := TIKSolver.SolveFABRIK(FingerChain, TargetFingerTip, 15, 0.01);
  
  WriteLn(#13#10'Finger chain after IK:');
  for I := 0 to High(SolvedFinger) do
  begin
    WriteLn(Format('  Joint %d:', [I]));
    WriteLn(Format('    Position: (%.2f, %.2f, %.2f)', 
      [SolvedFinger[I].Position.X, SolvedFinger[I].Position.Y, SolvedFinger[I].Position.Z]));
    WriteLn(Format('    Rotation: (%.2f°, %.2f°, %.2f°)', 
      [SolvedFinger[I].Rotation.X, SolvedFinger[I].Rotation.Y, SolvedFinger[I].Rotation.Z]));
  end;
  
  FingerDistance := SolvedFinger[High(SolvedFinger)].Position.Distance(TargetFingerTip);
  WriteLn(Format(#13#10'Distance to target: %.4f', [FingerDistance]));
  WriteLn;
end;

procedure Example5_CalculateJointAngles;
var
  ShoulderPos, TargetPosition: TVector3D;
  ArmChain, SolvedArm: TJointArray;
  Angles: TArray<Double>;
  I: Integer;
begin
  WriteLn('Example 5: Calculating joint angles');
  WriteLn('------------------------------------');
  
  ShoulderPos := TVector3D.Create(0, 0, 0);
  ArmChain := TIKSolver.CreateArmChain(ShoulderPos, 1.0, 0.9);
  TargetPosition := TVector3D.Create(0.8, -1.5, 0.3);
  
  SolvedArm := TIKSolver.SolveCCD(ArmChain, TargetPosition, 20, 0.01);
  Angles := TIKSolver.CalculateJointAngles(SolvedArm);
  
  WriteLn('Joint angles in the solved arm chain:');
  for I := 0 to High(Angles) do
    WriteLn(Format('  Joint %d angle: %.2f°', [I + 1, Angles[I]]));
  WriteLn;
end;

procedure Example6_MultipleFingers;
var
  HandBase: TVector3D;
  FingerOffsets: array[0..4] of TVector3D;
  FingerTargets: array[0..4] of TVector3D;
  FingerNames: array[0..4] of string;
  FingerBoneLengths: TArray<Double>;
  FingerChain, SolvedFinger: TJointArray;
  I: Integer;
  BasePos, TipPos: TVector3D;
  Distance: Double;
begin
  WriteLn('Example 6: Moving multiple fingers on a hand');
  WriteLn('---------------------------------------------');
  
  HandBase := TVector3D.Create(0, 0, 0);
  
  // Define finger offsets
  FingerOffsets[0] := TVector3D.Create(-0.3, 0, 0.2);
  FingerOffsets[1] := TVector3D.Create(-0.15, 0, 0);
  FingerOffsets[2] := TVector3D.Create(0, 0, 0);
  FingerOffsets[3] := TVector3D.Create(0.15, 0, 0);
  FingerOffsets[4] := TVector3D.Create(0.3, 0, -0.1);
  
  // Define finger names
  FingerNames[0] := 'Thumb';
  FingerNames[1] := 'Index';
  FingerNames[2] := 'Middle';
  FingerNames[3] := 'Ring';
  FingerNames[4] := 'Pinky';
  
  // Define target positions (e.g., making a fist)
  FingerTargets[0] := TVector3D.Create(0.3, 0.5, 0.3);
  FingerTargets[1] := TVector3D.Create(0.5, 0.4, 0.1);
  FingerTargets[2] := TVector3D.Create(0.6, 0.3, 0.0);
  FingerTargets[3] := TVector3D.Create(0.5, 0.3, -0.1);
  FingerTargets[4] := TVector3D.Create(0.4, 0.2, -0.2);
  
  SetLength(FingerBoneLengths, 3);
  FingerBoneLengths[0] := 0.4;
  FingerBoneLengths[1] := 0.3;
  FingerBoneLengths[2] := 0.25;
  
  WriteLn('Solving IK for all fingers:');
  for I := 0 to 4 do
  begin
    BasePos := HandBase.Add(FingerOffsets[I]);
    FingerChain := TIKSolver.CreateFingerChain(BasePos, FingerBoneLengths, TVector3D.Create(1, 0, 0));
    SolvedFinger := TIKSolver.SolveFABRIK(FingerChain, FingerTargets[I], 15, 0.01);
    TipPos := SolvedFinger[High(SolvedFinger)].Position;
    Distance := TipPos.Distance(FingerTargets[I]);
    WriteLn(Format('  %s: Target distance = %.4f', [FingerNames[I], Distance]));
  end;
  WriteLn;
end;

begin
  try
    WriteLn('=== IK Solver Examples ===');
    WriteLn;
    
    Example1_SimpleSingleJoint;
    Example2_ArmIKWithCCD;
    Example3_ArmIKWithFABRIK;
    Example4_FingerIK;
    Example5_CalculateJointAngles;
    Example6_MultipleFingers;
    
    WriteLn('=== Examples Complete ===');
    WriteLn;
    WriteLn('Press Enter to exit...');
    ReadLn;
  except
    on E: Exception do
    begin
      WriteLn('Error: ', E.Message);
      ReadLn;
    end;
  end;
end.
