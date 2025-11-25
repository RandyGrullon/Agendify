import { List, Calendar as CalendarIcon, Layout } from "lucide-react";

interface ViewSwitcherProps {
    currentView: "list" | "calendar" | "kanban";
    onViewChange: (view: "list" | "calendar" | "kanban") => void;
}

export default function ViewSwitcher({
    currentView,
    onViewChange,
}: ViewSwitcherProps) {
    return (
        <div className="flex bg-gray-100 p-1 rounded-lg">
            <button
                onClick={() => onViewChange("list")}
                className={`p-2 rounded-md transition-all ${currentView === "list"
                        ? "bg-white shadow text-blue-600"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                title="Vista de Lista"
            >
                <List size={18} />
            </button>
            <button
                onClick={() => onViewChange("calendar")}
                className={`p-2 rounded-md transition-all ${currentView === "calendar"
                        ? "bg-white shadow text-blue-600"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                title="Vista de Calendario"
            >
                <CalendarIcon size={18} />
            </button>
            <button
                onClick={() => onViewChange("kanban")}
                className={`p-2 rounded-md transition-all ${currentView === "kanban"
                        ? "bg-white shadow text-blue-600"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                title="Vista Kanban"
            >
                <Layout size={18} />
            </button>
        </div>
    );
}
