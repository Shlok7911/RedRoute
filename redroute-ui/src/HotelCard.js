import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from "react-router-dom";
export default function HotelCard({ id, name, city, price, rating }) {
    return (_jsxs("div", { className: "rounded-2xl shadow-md p-4 bg-white hover:shadow-lg transition", children: [_jsxs("div", { className: "flex justify-between items-center mb-2", children: [_jsx("h2", { className: "text-xl font-semibold", children: name }), _jsxs("span", { className: "text-yellow-500 font-medium", children: [rating.toFixed(1), " \u2605"] })] }), _jsx("p", { className: "text-gray-600", children: city }), _jsxs("p", { className: "text-gray-800 mt-2 font-bold", children: ["\u20B9", price, " / night"] }), _jsx(Link, { to: `/hotels/${id}`, className: "inline-block mt-3 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-500", children: "View Details" })] }));
}
