import { Menu, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { MoreVertical, Download, Upload } from "lucide-react";

interface ActionMenuProps {
    onImport: () => void;
    onExport: () => void;
}

export default function ActionMenu({ onImport, onExport }: ActionMenuProps) {
    return (
        <Menu as="div" className="relative inline-block text-left">
            <div>
                <Menu.Button className="flex items-center justify-center p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors">
                    <MoreVertical size={20} />
                </Menu.Button>
            </div>
            <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
            >
                <Menu.Items className="absolute right-0 mt-2 w-40 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                    <div className="px-1 py-1">
                        <Menu.Item>
                            {({ active }) => (
                                <button
                                    onClick={onImport}
                                    className={`${active ? "bg-blue-500 text-white" : "text-gray-900"
                                        } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                                >
                                    <Upload className="mr-2 h-4 w-4" aria-hidden="true" />
                                    Importar
                                </button>
                            )}
                        </Menu.Item>
                        <Menu.Item>
                            {({ active }) => (
                                <button
                                    onClick={onExport}
                                    className={`${active ? "bg-blue-500 text-white" : "text-gray-900"
                                        } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                                >
                                    <Download className="mr-2 h-4 w-4" aria-hidden="true" />
                                    Exportar
                                </button>
                            )}
                        </Menu.Item>
                    </div>
                </Menu.Items>
            </Transition>
        </Menu>
    );
}
