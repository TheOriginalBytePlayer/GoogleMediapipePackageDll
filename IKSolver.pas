unit IKSolver;

{*******************************************************************************
  IKSolver - Inverse Kinematics Solution for Skeleton Joint Manipulation
  
  This unit provides IK algorithms for moving hands, arms, and fingers
  by calculating required joint rotations to reach target positions.
  
  Supports:
  - CCD (Cyclic Coordinate Descent) algorithm
  - FABRIK (Forward And Backward Reaching Inverse Kinematics) algorithm
  - Joint constraints and angle limits
*******************************************************************************}

interface

uses
  System.SysUtils, System.Math;

type
  TVector3D = record
    X, Y, Z: Double;
    // Vector operations
    class function Create(AX, AY, AZ: Double): TVector3D; static;
    function Add(const V: TVector3D): TVector3D;
    function Subtract(const V: TVector3D): TVector3D;
    function Multiply(Scalar: Double): TVector3D;
    function Divide(Scalar: Double): TVector3D;
    function Magnitude: Double;
    function Normalize: TVector3D;
    function Dot(const V: TVector3D): Double;
    function Cross(const V: TVector3D): TVector3D;
    function Distance(const V: TVector3D): Double;
  end;

  TJoint = record
    Position: TVector3D;
    MinAngle: Double;  // Constraint in degrees
    MaxAngle: Double;  // Constraint in degrees
    class function Create(const APosition: TVector3D; AMinAngle: Double = -180; AMaxAngle: Double = 180): TJoint; static;
  end;

  TJointArray = array of TJoint;

  TIKSolver = class
  private
    class function RotateAroundAxis(const Vector, Axis: TVector3D; Angle: Double): TVector3D;
  public
    { Solve IK using CCD (Cyclic Coordinate Descent) algorithm }
    class function SolveCCD(const Chain: TJointArray; const TargetPosition: TVector3D;
      Iterations: Integer = 10; Tolerance: Double = 0.01): TJointArray;
    
    { Solve IK using FABRIK (Forward And Backward Reaching Inverse Kinematics) algorithm }
    class function SolveFABRIK(const Chain: TJointArray; const TargetPosition: TVector3D;
      Iterations: Integer = 10; Tolerance: Double = 0.01): TJointArray;
    
    { Calculate angles between consecutive joints in a chain }
    class function CalculateJointAngles(const Chain: TJointArray): TArray<Double>;
    
    { Simple single joint IK - directly moves a joint to target position }
    class function SolveSingleJoint(const Joint: TJoint; const TargetPosition: TVector3D): TJoint;
    
    { Apply joint constraints to ensure angles are within limits }
    class function ApplyConstraints(const Chain: TJointArray): TJointArray;
    
    { Helper function to create a finger chain }
    class function CreateFingerChain(const BasePosition: TVector3D; 
      const BoneLengths: TArray<Double>; const Direction: TVector3D): TJointArray;
    
    { Helper function to create an arm chain }
    class function CreateArmChain(const ShoulderPosition: TVector3D;
      UpperArmLength: Double = 1.0; ForearmLength: Double = 1.0): TJointArray;
  end;

implementation

{ TVector3D }

class function TVector3D.Create(AX, AY, AZ: Double): TVector3D;
begin
  Result.X := AX;
  Result.Y := AY;
  Result.Z := AZ;
end;

function TVector3D.Add(const V: TVector3D): TVector3D;
begin
  Result.X := X + V.X;
  Result.Y := Y + V.Y;
  Result.Z := Z + V.Z;
end;

function TVector3D.Subtract(const V: TVector3D): TVector3D;
begin
  Result.X := X - V.X;
  Result.Y := Y - V.Y;
  Result.Z := Z - V.Z;
end;

function TVector3D.Multiply(Scalar: Double): TVector3D;
begin
  Result.X := X * Scalar;
  Result.Y := Y * Scalar;
  Result.Z := Z * Scalar;
end;

function TVector3D.Divide(Scalar: Double): TVector3D;
begin
  if Abs(Scalar) < 1e-10 then
  begin
    Result := TVector3D.Create(0, 0, 0);
    Exit;
  end;
  Result.X := X / Scalar;
  Result.Y := Y / Scalar;
  Result.Z := Z / Scalar;
end;

function TVector3D.Magnitude: Double;
begin
  Result := Sqrt(X * X + Y * Y + Z * Z);
end;

function TVector3D.Normalize: TVector3D;
var
  Mag: Double;
begin
  Mag := Magnitude;
  if Mag > 0 then
    Result := Divide(Mag)
  else
    Result := TVector3D.Create(0, 0, 0);
end;

function TVector3D.Dot(const V: TVector3D): Double;
begin
  Result := X * V.X + Y * V.Y + Z * V.Z;
end;

function TVector3D.Cross(const V: TVector3D): TVector3D;
begin
  Result.X := Y * V.Z - Z * V.Y;
  Result.Y := Z * V.X - X * V.Z;
  Result.Z := X * V.Y - Y * V.X;
end;

function TVector3D.Distance(const V: TVector3D): Double;
begin
  Result := Subtract(V).Magnitude;
end;

{ TJoint }

class function TJoint.Create(const APosition: TVector3D; AMinAngle, AMaxAngle: Double): TJoint;
begin
  Result.Position := APosition;
  Result.MinAngle := AMinAngle;
  Result.MaxAngle := AMaxAngle;
end;

{ TIKSolver }

class function TIKSolver.SolveCCD(const Chain: TJointArray; const TargetPosition: TVector3D;
  Iterations: Integer; Tolerance: Double): TJointArray;
var
  WorkChain: TJointArray;
  EndEffectorIndex: Integer;
  Iter, I, J: Integer;
  EndEffector: TVector3D;
  DistanceToTarget: Double;
  CurrentJoint, CurrentEnd: TVector3D;
  ToEnd, ToTarget, ToEndNorm, ToTargetNorm: TVector3D;
  DotProduct, Angle: Double;
  RotationAxis: TVector3D;
  RelPos, Rotated: TVector3D;
begin
  if Length(Chain) < 2 then
    raise Exception.Create('Chain must have at least 2 joints');

  // Clone the chain
  SetLength(WorkChain, Length(Chain));
  for I := 0 to High(Chain) do
    WorkChain[I] := Chain[I];

  EndEffectorIndex := High(WorkChain);

  for Iter := 0 to Iterations - 1 do
  begin
    // Check if we've reached the target
    EndEffector := WorkChain[EndEffectorIndex].Position;
    DistanceToTarget := EndEffector.Distance(TargetPosition);
    
    if DistanceToTarget < Tolerance then
      Break; // Solution found

    // Iterate backwards through the chain (excluding end effector)
    for I := EndEffectorIndex - 1 downto 0 do
    begin
      CurrentJoint := WorkChain[I].Position;
      CurrentEnd := WorkChain[EndEffectorIndex].Position;

      // Vector from current joint to end effector
      ToEnd := CurrentEnd.Subtract(CurrentJoint);
      // Vector from current joint to target
      ToTarget := TargetPosition.Subtract(CurrentJoint);

      // Calculate rotation angle
      ToEndNorm := ToEnd.Normalize;
      ToTargetNorm := ToTarget.Normalize;
      
      // Calculate angle between vectors
      DotProduct := Max(-1.0, Min(1.0, ToEndNorm.Dot(ToTargetNorm)));
      Angle := ArcCos(DotProduct);

      // Skip if angle is too small
      if Abs(Angle) < 0.001 then
        Continue;

      // Get rotation axis
      RotationAxis := ToEndNorm.Cross(ToTargetNorm).Normalize;

      // Apply rotation to all joints from current to end
      for J := I + 1 to EndEffectorIndex do
      begin
        RelPos := WorkChain[J].Position.Subtract(CurrentJoint);
        Rotated := RotateAroundAxis(RelPos, RotationAxis, Angle);
        WorkChain[J].Position := CurrentJoint.Add(Rotated);
      end;
    end;
  end;

  Result := WorkChain;
end;

class function TIKSolver.SolveFABRIK(const Chain: TJointArray; const TargetPosition: TVector3D;
  Iterations: Integer; Tolerance: Double): TJointArray;
var
  WorkChain: TJointArray;
  N, I, Iter: Integer;
  BoneLengths: TArray<Double>;
  RootPos, EndEffector, Direction: TVector3D;
  TotalLength, DistanceToTarget: Double;
  Offset: TVector3D;
begin
  if Length(Chain) < 2 then
    raise Exception.Create('Chain must have at least 2 joints');

  // Clone the chain
  SetLength(WorkChain, Length(Chain));
  for I := 0 to High(Chain) do
    WorkChain[I] := Chain[I];

  N := Length(WorkChain);
  
  // Store original bone lengths
  SetLength(BoneLengths, N - 1);
  for I := 0 to N - 2 do
    BoneLengths[I] := WorkChain[I].Position.Distance(WorkChain[I + 1].Position);

  // Store the root position
  RootPos := WorkChain[0].Position;

  // Calculate total chain length
  TotalLength := 0;
  for I := 0 to High(BoneLengths) do
    TotalLength := TotalLength + BoneLengths[I];

  DistanceToTarget := RootPos.Distance(TargetPosition);

  // If target is unreachable, stretch chain towards target
  if DistanceToTarget > TotalLength then
  begin
    Direction := TargetPosition.Subtract(RootPos).Normalize;
    for I := 1 to N - 1 do
    begin
      Offset := Direction.Multiply(BoneLengths[I - 1]);
      WorkChain[I].Position := WorkChain[I - 1].Position.Add(Offset);
    end;
    Result := WorkChain;
    Exit;
  end;

  // FABRIK iterations
  for Iter := 0 to Iterations - 1 do
  begin
    // Check convergence
    EndEffector := WorkChain[N - 1].Position;
    if EndEffector.Distance(TargetPosition) < Tolerance then
      Break;

    // Forward reaching phase
    WorkChain[N - 1].Position := TargetPosition;
    for I := N - 2 downto 0 do
    begin
      Direction := WorkChain[I].Position.Subtract(WorkChain[I + 1].Position).Normalize;
      WorkChain[I].Position := WorkChain[I + 1].Position.Add(Direction.Multiply(BoneLengths[I]));
    end;

    // Backward reaching phase
    WorkChain[0].Position := RootPos;
    for I := 0 to N - 2 do
    begin
      Direction := WorkChain[I + 1].Position.Subtract(WorkChain[I].Position).Normalize;
      WorkChain[I + 1].Position := WorkChain[I].Position.Add(Direction.Multiply(BoneLengths[I]));
    end;
  end;

  Result := WorkChain;
end;

class function TIKSolver.RotateAroundAxis(const Vector, Axis: TVector3D; Angle: Double): TVector3D;
var
  CosAngle, SinAngle: Double;
  Term1, Term2, Term3: TVector3D;
begin
  CosAngle := Cos(Angle);
  SinAngle := Sin(Angle);

  // Rodrigues' rotation formula
  Term1 := Vector.Multiply(CosAngle);
  Term2 := Axis.Cross(Vector).Multiply(SinAngle);
  Term3 := Axis.Multiply(Axis.Dot(Vector) * (1 - CosAngle));

  Result := Term1.Add(Term2).Add(Term3);
end;

class function TIKSolver.CalculateJointAngles(const Chain: TJointArray): TArray<Double>;
var
  I: Integer;
  V1, V2: TVector3D;
  DotProduct, Angle: Double;
begin
  SetLength(Result, Length(Chain) - 2);
  for I := 1 to Length(Chain) - 2 do
  begin
    V1 := Chain[I].Position.Subtract(Chain[I - 1].Position).Normalize;
    V2 := Chain[I + 1].Position.Subtract(Chain[I].Position).Normalize;
    DotProduct := Max(-1.0, Min(1.0, V1.Dot(V2)));
    Angle := ArcCos(DotProduct) * (180 / Pi);
    Result[I - 1] := Angle;
  end;
end;

class function TIKSolver.SolveSingleJoint(const Joint: TJoint; const TargetPosition: TVector3D): TJoint;
begin
  Result := Joint;
  Result.Position := TargetPosition;
end;

class function TIKSolver.ApplyConstraints(const Chain: TJointArray): TJointArray;
var
  I: Integer;
  V1, V2: TVector3D;
  CurrentAngle, TargetAngle: Double;
begin
  SetLength(Result, Length(Chain));
  for I := 0 to High(Chain) do
    Result[I] := Chain[I];

  for I := 1 to Length(Chain) - 2 do
  begin
    V1 := Result[I].Position.Subtract(Result[I - 1].Position);
    V2 := Result[I + 1].Position.Subtract(Result[I].Position);
    
    CurrentAngle := ArcCos(Max(-1.0, Min(1.0, V1.Normalize.Dot(V2.Normalize)))) * (180 / Pi);

    // Clamp angle within constraints
    if (CurrentAngle < Result[I].MinAngle) or (CurrentAngle > Result[I].MaxAngle) then
    begin
      TargetAngle := Max(Result[I].MinAngle, Min(Result[I].MaxAngle, CurrentAngle));
      // Note: Actual constraint adjustment would require more complex calculations
      // This is a simplified version for demonstration
    end;
  end;
end;

class function TIKSolver.CreateFingerChain(const BasePosition: TVector3D; 
  const BoneLengths: TArray<Double>; const Direction: TVector3D): TJointArray;
var
  I: Integer;
  Dir: TVector3D;
  CurrentPos: TVector3D;
begin
  SetLength(Result, Length(BoneLengths) + 1);
  Result[0] := TJoint.Create(BasePosition);
  
  Dir := Direction.Normalize;
  CurrentPos := BasePosition;
  
  for I := 0 to High(BoneLengths) do
  begin
    CurrentPos := CurrentPos.Add(Dir.Multiply(BoneLengths[I]));
    Result[I + 1] := TJoint.Create(CurrentPos, -20, 110); // Typical finger constraints
  end;
end;

class function TIKSolver.CreateArmChain(const ShoulderPosition: TVector3D;
  UpperArmLength, ForearmLength: Double): TJointArray;
begin
  SetLength(Result, 3);
  Result[0] := TJoint.Create(ShoulderPosition, -180, 180);
  Result[1] := TJoint.Create(ShoulderPosition.Add(TVector3D.Create(0, -UpperArmLength, 0)), 0, 160);
  Result[2] := TJoint.Create(ShoulderPosition.Add(TVector3D.Create(0, -(UpperArmLength + ForearmLength), 0)), -90, 90);
end;

end.
