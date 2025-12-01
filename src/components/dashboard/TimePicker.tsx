"use client";

import { useState, useEffect, useRef } from "react";
import { Clock } from "lucide-react";

interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  error?: string;
  required?: boolean;
}

export default function TimePicker({
  value,
  onChange,
  label,
  error,
  required,
}: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hours, setHours] = useState(9);
  const [minutes, setMinutes] = useState(0);
  const [period, setPeriod] = useState<"AM" | "PM">("AM");
  const [selectingMinutes, setSelectingMinutes] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse initial value
  useEffect(() => {
    if (value) {
      const [h, m] = value.split(":");
      const hour = parseInt(h);
      const minute = parseInt(m);

      if (hour >= 12) {
        setPeriod("PM");
        setHours(hour === 12 ? 12 : hour - 12);
      } else {
        setPeriod("AM");
        setHours(hour === 0 ? 12 : hour);
      }
      setMinutes(minute);
    }
  }, [value]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const handleApply = () => {
    let hour24 = hours;

    if (period === "PM" && hour24 !== 12) {
      hour24 += 12;
    } else if (period === "AM" && hour24 === 12) {
      hour24 = 0;
    }

    const timeString = `${String(hour24).padStart(2, "0")}:${String(
      minutes
    ).padStart(2, "0")}`;
    onChange(timeString);
    setIsOpen(false);
    setSelectingMinutes(false);
  };

  const formatDisplayTime = (val: string) => {
    if (!val) return "Seleccionar";
    const [h, m] = val.split(":");
    const hour = parseInt(h);
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const displayPeriod = hour >= 12 ? "PM" : "AM";
    return `${displayHour}:${m} ${displayPeriod}`;
  };

  const handleClockClick = (angle: number) => {
    if (selectingMinutes) {
      // Calculate minute from angle (0-360 degrees, 12 positions for 5-min intervals)
      const minute = Math.round((angle / 30) * 5) % 60;
      setMinutes(minute);
    } else {
      // Calculate hour from angle (0-360 degrees, 12 hours)
      const hour = Math.round(angle / 30);
      setHours(hour === 0 ? 12 : hour);
    }
  };

  const getAngleFromPosition = (
    cx: number,
    cy: number,
    x: number,
    y: number
  ) => {
    const dx = x - cx;
    const dy = y - cy;
    let angle = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
    if (angle < 0) angle += 360;
    return angle;
  };

  const handleClockMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const angle = getAngleFromPosition(cx, cy, x, y);
    handleClockClick(angle);
  };

  // Generate clock numbers
  const clockNumbers = Array.from({ length: 12 }, (_, i) => {
    const number = selectingMinutes ? i * 5 : i === 0 ? 12 : i;
    const angle = (i * 30 - 90) * (Math.PI / 180);
    const radius = 85;
    const x = 120 + radius * Math.cos(angle);
    const y = 120 + radius * Math.sin(angle);

    const isSelected = selectingMinutes
      ? minutes === i * 5
      : hours === (i === 0 ? 12 : i);

    return { number, x, y, isSelected };
  });

  // Calculate hand angle
  const handAngle = selectingMinutes
    ? (minutes / 5) * 30 - 90
    : (hours === 12 ? 0 : hours) * 30 - 90;

  return (
    <div className="relative" ref={containerRef}>
      <label className="block text-sm font-semibold text-gray-900 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="mt-1 w-full flex items-center rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 sm:text-sm border p-2 pl-10 text-gray-900 bg-white hover:bg-gray-50 transition-colors"
      >
        <Clock className="absolute left-3 h-4 w-4 text-gray-400" />
        <span className="flex-1 text-left">{formatDisplayTime(value)}</span>
      </button>

      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}

      {isOpen && (
        <div className="absolute z-50 mt-1 bg-white border border-gray-300 rounded-lg shadow-xl p-4 w-80">
          <div className="space-y-4">
            {/* Time Display */}
            <div className="text-center bg-blue-50 rounded-lg p-3">
              <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectingMinutes(false)}
                  className={`text-3xl font-bold transition-colors ${
                    !selectingMinutes ? "text-blue-600" : "text-gray-400"
                  }`}
                >
                  {String(hours).padStart(2, "0")}
                </button>
                <span className="text-3xl font-bold text-gray-400">:</span>
                <button
                  type="button"
                  onClick={() => setSelectingMinutes(true)}
                  className={`text-3xl font-bold transition-colors ${
                    selectingMinutes ? "text-blue-600" : "text-gray-400"
                  }`}
                >
                  {String(minutes).padStart(2, "0")}
                </button>
                <div className="ml-2 flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => setPeriod("AM")}
                    className={`text-xs px-2 py-0.5 rounded ${
                      period === "AM"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    AM
                  </button>
                  <button
                    type="button"
                    onClick={() => setPeriod("PM")}
                    className={`text-xs px-2 py-0.5 rounded ${
                      period === "PM"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    PM
                  </button>
                </div>
              </div>
            </div>

            {/* Analog Clock */}
            <div className="relative">
              <svg
                width="240"
                height="240"
                viewBox="0 0 240 240"
                className="mx-auto select-none"
                onMouseDown={handleClockMouseDown}
              >
                {/* Clock face */}
                <circle
                  cx="120"
                  cy="120"
                  r="110"
                  fill="white"
                  stroke="#e5e7eb"
                  strokeWidth="2"
                />

                {/* Clock numbers */}
                {clockNumbers.map((item, i) => (
                  <g key={i}>
                    <circle
                      cx={item.x}
                      cy={item.y}
                      r="18"
                      fill={item.isSelected ? "#3b82f6" : "#f3f4f6"}
                      className="cursor-pointer hover:fill-blue-100 transition-colors"
                    />
                    <text
                      x={item.x}
                      y={item.y}
                      textAnchor="middle"
                      dominantBaseline="central"
                      className="text-sm font-semibold pointer-events-none"
                      fill={item.isSelected ? "white" : "#374151"}
                    >
                      {item.number}
                    </text>
                  </g>
                ))}

                {/* Center dot */}
                <circle cx="120" cy="120" r="6" fill="#3b82f6" />

                {/* Clock hand */}
                <line
                  x1="120"
                  y1="120"
                  x2={120 + 70 * Math.cos((handAngle * Math.PI) / 180)}
                  y2={120 + 70 * Math.sin((handAngle * Math.PI) / 180)}
                  stroke="#3b82f6"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setSelectingMinutes(false);
                }}
                className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleApply}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
