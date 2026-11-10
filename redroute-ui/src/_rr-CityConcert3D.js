"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { Suspense, useMemo } from "react";
function Skyscraper({ x, z, h }) {
    const geom = useMemo(() => new THREE.BoxGeometry(1, h, 1), [h]);
    const mat = useMemo(() => new THREE.MeshStandardMaterial({ color: new THREE.Color(0.07, 0.07, 0.07), metalness: 0.6, roughness: 0.5 }), []);
    return (_jsx("mesh", { geometry: geom, material: mat, position: [x, h / 2, z], castShadow: true, receiveShadow: true, children: _jsx("meshStandardMaterial", { color: "#121212" }) }));
}
//redploy
function Buildings() {
    const blocks = useMemo(() => {
        const arr = [];
        for (let x = -8; x <= 8; x += 2) {
            for (let z = -8; z <= 8; z += 2) {
                if (Math.abs(x) < 2 && Math.abs(z) < 2)
                    continue; // leave center for stage
                const h = 1 + Math.random() * 6;
                arr.push({ x, z, h });
            }
        }
        return arr;
    }, []);
    return (_jsx("group", { children: blocks.map((b, i) => _jsx(Skyscraper, { ...b }, i)) }));
}
function Stage() {
    return (_jsxs("group", { children: [_jsxs("mesh", { position: [0, 0.2, 0], receiveShadow: true, children: [_jsx("cylinderGeometry", { args: [2.5, 2.5, 0.4, 64] }), _jsx("meshStandardMaterial", { color: "#0f0f0f", metalness: 0.8, roughness: 0.2 })] }), _jsxs("mesh", { position: [0, 2.2, 0], children: [_jsx("torusGeometry", { args: [2.6, 0.04, 16, 100] }), _jsx("meshStandardMaterial", { color: "#151515", metalness: 1, roughness: 0.4 })] }), _jsx(MovingSpot, { angle: 0 }), _jsx(MovingSpot, { angle: Math.PI / 2 }), _jsx(MovingSpot, { angle: Math.PI }), _jsx(MovingSpot, { angle: (3 * Math.PI) / 2 })] }));
}
function MovingSpot({ angle }) {
    const color = new THREE.Color("#E50914");
    const light = useMemo(() => new THREE.SpotLight(color, 2.3, 18, Math.PI / 8, 0.4, 0.5), []);
    // rudimentary animation using onUpdate inside fiber loop
    let t = 0;
    return (_jsx("primitive", { object: light, position: [Math.cos(angle) * 2.6, 2.5, Math.sin(angle) * 2.6], rotation: [0, -angle, 0], onUpdate: (obj) => {
            t += 0.02; // approximate; fiber will keep calling
            const r = 4;
            obj.target.position.set(Math.cos(angle + t) * r, 0.5 + Math.sin(t) * 0.5, Math.sin(angle + t) * r);
            obj.target.updateMatrixWorld();
        } }));
}
function Ground() {
    return (_jsxs("mesh", { rotation: [-Math.PI / 2, 0, 0], receiveShadow: true, children: [_jsx("planeGeometry", { args: [60, 60] }), _jsx("meshStandardMaterial", { color: "#050505" })] }));
}
export default function CityConcert3D() {
    return (_jsxs(Canvas, { shadows: true, dpr: [1, 2], camera: { position: [8, 8, 10], fov: 48 }, children: [_jsx("color", { attach: "background", args: ["#000000"] }), _jsx("ambientLight", { intensity: 0.2 }), _jsx("directionalLight", { position: [6, 10, 4], intensity: 1.2, castShadow: true }), _jsxs(Suspense, { fallback: null, children: [_jsx(Ground, {}), _jsx(Buildings, {}), _jsx(Stage, {})] }), _jsx(OrbitControls, { enablePan: false, minPolarAngle: 0.9, maxPolarAngle: 1.35 }), _jsx("fog", { attach: "fog", args: ["#090909", 10, 40] })] }));
}
