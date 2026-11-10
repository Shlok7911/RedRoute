import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
const SquareImage = ({ size = 200, color = '#3b82f6', className = '' }) => {
    return (_jsx("div", { className: `flex items-center justify-center ${className}`, style: {
            width: size,
            height: size,
            backgroundColor: color,
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        }, children: _jsx("span", { className: "text-white font-bold text-lg", children: "SQUARE" }) }));
};
export default SquareImage;
