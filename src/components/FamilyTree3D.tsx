import React, { useRef, useState, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree, extend } from '@react-three/fiber';
import { OrbitControls, Text, Line, Sphere, Box } from '@react-three/drei';
import * as THREE from 'three';
import { FamilyMember, Disease } from '../types';
import { TreeLayoutEngine } from '../utils/treeLayout';

// Extend the THREE namespace for R3F
extend(THREE);

interface FamilyTree3DProps {
  members: FamilyMember[];
  diseases: Disease[];
  selectedMember: FamilyMember | null;
  onMemberSelect: (member: FamilyMember) => void;
  onMemberHover: (member: FamilyMember | null, position?: { x: number; y: number }) => void;
  focusOnMember?: FamilyMember | null;
}

interface FamilyTreeSceneProps {
  members: FamilyMember[];
  selectedMember: FamilyMember | null;
  onMemberSelect: (member: FamilyMember) => void;
  onMemberHover: (member: FamilyMember | null, position?: { x: number; y: number }) => void;
  focusOnMember?: FamilyMember | null;
}

interface MemberNodeProps {
  member: FamilyMember;
  isSelected: boolean;
  onClick: () => void;
  onPointerOver: (event: any) => void;
  onPointerOut: () => void;
}

const MemberNode: React.FC<MemberNodeProps> = ({
  member,
  isSelected,
  onClick,
  onPointerOver,
  onPointerOut
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  // Calculate risk-based color
  const getRiskColor = () => {
    const maxRisk = Math.max(...Object.values(member.riskScores), 0);
    
    if (member.diseases.length > 0) {
      return '#dc2626'; // Red for affected
    }
    
    if (maxRisk > 0.7) {
      return '#f59e0b'; // Orange for high risk
    } else if (maxRisk > 0.3) {
      return '#eab308'; // Yellow for moderate risk
    }
    
    return member.gender === 'male' ? '#3b82f6' : '#ec4899'; // Blue for male, pink for female
  };

  const getNodeSize = () => {
    const baseSize = 0.3;
    const riskMultiplier = Math.max(...Object.values(member.riskScores), 0) * 0.5;
    return baseSize + riskMultiplier;
  };

  useFrame((state) => {
    if (meshRef.current) {
      // Gentle floating animation
      meshRef.current.position.y = member.position.y + Math.sin(state.clock.elapsedTime + member.position.x) * 0.1;
      
      // Pulse effect for high-risk members
      const maxRisk = Math.max(...Object.values(member.riskScores), 0);
      if (maxRisk > 0.5) {
        const pulse = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.1;
        meshRef.current.scale.setScalar(pulse);
      }
    }
  });

  return (
    <group position={[member.position.x, member.position.y, member.position.z]}>
      {/* Main node */}
      <Sphere
        ref={meshRef}
        args={[getNodeSize(), 16, 16]}
        onClick={onClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          onPointerOver(e);
        }}
        onPointerOut={() => {
          setHovered(false);
          onPointerOut();
        }}
      >
        <meshStandardMaterial
          color={getRiskColor()}
          emissive={isSelected || hovered ? getRiskColor() : '#000000'}
          emissiveIntensity={isSelected ? 0.3 : hovered ? 0.2 : 0}
          roughness={0.4}
          metalness={0.1}
        />
      </Sphere>

      {/* Selection ring */}
      {isSelected && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[getNodeSize() + 0.1, getNodeSize() + 0.2, 32]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.8} />
        </mesh>
      )}

      {/* Disease indicators */}
      {member.diseases.map((disease, index) => (
        <Box
          key={disease.id}
          args={[0.1, 0.1, 0.1]}
          position={[
            Math.cos((index / member.diseases.length) * Math.PI * 2) * (getNodeSize() + 0.3),
            0,
            Math.sin((index / member.diseases.length) * Math.PI * 2) * (getNodeSize() + 0.3)
          ]}
        >
          <meshStandardMaterial color={disease.color} />
        </Box>
      ))}

      {/* Name label */}
      <Text
        position={[0, -getNodeSize() - 0.5, 0]}
        fontSize={0.2}
        color="#374151"
        anchorX="center"
        anchorY="top"
        font="/fonts/inter-medium.woff"
      >
        {member.name}
      </Text>

      {/* Age label */}
      <Text
        position={[0, -getNodeSize() - 0.7, 0]}
        fontSize={0.15}
        color="#6b7280"
        anchorX="center"
        anchorY="top"
        font="/fonts/inter-regular.woff"
      >
        Age {member.age}
      </Text>
    </group>
  );
};

interface ConnectionLineProps {
  from: THREE.Vector3;
  to: THREE.Vector3;
  type: 'parent' | 'spouse';
}

const ConnectionLine: React.FC<ConnectionLineProps> = ({ from, to, type }) => {
  const points = useMemo(() => {
    if (type === 'parent') {
      // Curved line for parent-child relationships
      const midY = (from.y + to.y) / 2;
      return [
        from,
        new THREE.Vector3(from.x, midY, from.z),
        new THREE.Vector3(to.x, midY, to.z),
        to
      ];
    } else {
      // Straight line for spouse relationships
      return [from, to];
    }
  }, [from, to, type]);

  return (
    <Line
      points={points}
      color={type === 'parent' ? '#6b7280' : '#ef4444'}
      lineWidth={type === 'parent' ? 2 : 3}
      dashed={type === 'spouse'}
    />
  );
};

const FamilyTreeScene: React.FC<{
  members: FamilyMember[];
  selectedMember: FamilyMember | null;
  onMemberSelect: (member: FamilyMember) => void;
  onMemberHover: (member: FamilyMember | null, position?: { x: number; y: number }) => void;
  focusOnMember?: FamilyMember | null;
}> = ({ members, selectedMember, onMemberSelect, onMemberHover, focusOnMember }) => {
  const { camera, gl } = useThree();
  
  // Calculate layout
  const layoutMembers = useMemo(() => {
    return TreeLayoutEngine.calculateLayout(members);
  }, [members]);
  
  // Focus camera on specific member when requested
  useEffect(() => {
    if (focusOnMember) {
      const targetMember = layoutMembers.find(m => m.id === focusOnMember.id);
      if (targetMember) {
        const targetPosition = new THREE.Vector3(
          targetMember.position.x,
          targetMember.position.y + 2,
          targetMember.position.z + 5
        );
        
        // Smooth camera transition
        const startPosition = camera.position.clone();
        const duration = 1000; // 1 second
        const startTime = Date.now();
        
        const animateCamera = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);
          
          // Easing function for smooth animation
          const easeProgress = 1 - Math.pow(1 - progress, 3);
          
          camera.position.lerpVectors(startPosition, targetPosition, easeProgress);
          camera.lookAt(targetMember.position.x, targetMember.position.y, targetMember.position.z);
          
          if (progress < 1) {
            requestAnimationFrame(animateCamera);
          }
        };
        
        animateCamera();
      }
    }
  }, [focusOnMember, layoutMembers, camera]);

  // Calculate connections
  const connections = useMemo(() => {
    const lines: Array<{ from: THREE.Vector3; to: THREE.Vector3; type: 'parent' | 'spouse' }> = [];
    const memberMap = new Map(layoutMembers.map(m => [m.id, m]));

    layoutMembers.forEach(member => {
      // Parent-child connections
      member.childrenIds.forEach(childId => {
        const child = memberMap.get(childId);
        if (child) {
          lines.push({
            from: new THREE.Vector3(member.position.x, member.position.y, member.position.z),
            to: new THREE.Vector3(child.position.x, child.position.y, child.position.z),
            type: 'parent'
          });
        }
      });

      // Spouse connections (simplified - connect parents of same children)
      const spouses = layoutMembers.filter(other => 
        other.id !== member.id &&
        other.childrenIds.some(childId => member.childrenIds.includes(childId))
      );
      
      spouses.forEach(spouse => {
        if (member.id < spouse.id) { // Avoid duplicate lines
          lines.push({
            from: new THREE.Vector3(member.position.x, member.position.y, member.position.z),
            to: new THREE.Vector3(spouse.position.x, spouse.position.y, spouse.position.z),
            type: 'spouse'
          });
        }
      });
    });

    return lines;
  }, [layoutMembers]);

  // Auto-fit camera to tree
  useEffect(() => {
    if (layoutMembers.length > 0) {
      const boundingBox = TreeLayoutEngine.calculateBoundingBox(layoutMembers);
      const center = boundingBox.center;
      const size = Math.max(
        boundingBox.max.x - boundingBox.min.x,
        boundingBox.max.y - boundingBox.min.y,
        boundingBox.max.z - boundingBox.min.z
      );
      
      camera.position.set(center.x, center.y + size * 0.8, center.z + size * 1.2);
      camera.lookAt(center.x, center.y, center.z);
    }
  }, [layoutMembers, camera]);

  const handleMemberHover = (member: FamilyMember | null, event?: any) => {
    if (member && event) {
      const rect = gl.domElement.getBoundingClientRect();
      onMemberHover(member, {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      });
    } else {
      onMemberHover(null);
    }
  };

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={0.8} castShadow />
      <pointLight position={[-10, -10, -5]} intensity={0.4} />

      {/* Grid helper */}
      <gridHelper args={[20, 20, '#e5e7eb', '#f3f4f6']} position={[0, -10, 0]} />

      {/* Family members */}
      {layoutMembers.map(member => (
        <MemberNode
          key={member.id}
          member={member}
          isSelected={selectedMember?.id === member.id}
          onClick={() => onMemberSelect(member)}
          onPointerOver={(event) => handleMemberHover(member, event)}
          onPointerOut={() => handleMemberHover(null)}
        />
      ))}

      {/* Connections */}
      {connections.map((connection, index) => (
        <ConnectionLine
          key={index}
          from={connection.from}
          to={connection.to}
          type={connection.type}
        />
      ))}

      {/* Controls */}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={5}
        maxDistance={50}
        maxPolarAngle={Math.PI / 2}
      />
    </>
  );
};

const FamilyTree3D: React.FC<FamilyTree3DProps> = ({
  members,
  diseases,
  selectedMember,
  onMemberSelect,
  onMemberHover,
  focusOnMember
}) => {
  return (
    <div className="w-full h-full canvas-container">
      <Canvas
        camera={{ position: [0, 5, 10], fov: 60 }}
        shadows
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'linear-gradient(to bottom, #f8fafc, #e2e8f0)' }}
      >
        <FamilyTreeScene
          members={members}
          selectedMember={selectedMember}
          onMemberSelect={onMemberSelect}
          onMemberHover={onMemberHover}
          focusOnMember={focusOnMember}
        />
      </Canvas>
    </div>
  );
};

export default FamilyTree3D;