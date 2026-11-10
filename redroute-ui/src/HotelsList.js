import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import HotelCard from "./HotelCard";
export default function HotelsList() {
    const [hotels, setHotels] = useState([]);
    useEffect(() => {
        fetch("/api/hotels") // 👉 Adjust endpoint if needed
            .then((res) => res.json())
            .then(setHotels)
            .catch(console.error);
    }, []);
    return (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6", children: hotels.map((hotel) => (_jsx(HotelCard, { ...hotel }, hotel.id))) }));
}
