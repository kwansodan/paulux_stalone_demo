'use client'
import Modal from "@/components/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useState } from "react";
import CreateServiceForm from "./form/create-service-form";

interface ServicesHeaderProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

export default function ServicesHeader({ searchQuery, onSearchChange }: ServicesHeaderProps) {
  const [open, setOpen] = useState(false)
  return (
    <div className="mb-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Services</h1>
        <p className="text-sm sm:text-[16px] text-gray-600">
          Manage Your Salon Services
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search services..."
            className="pl-10 bg-white border-gray-200"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <Button
          className="bg-fuchsia-600 hover:bg-fuchsia-700 w-full sm:w-auto px-6 whitespace-nowrap"
          onClick={() => setOpen(true)}
        >
          + New Service
        </Button>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="New Service"
        childrenClassName="max-h-120"
        showSeparator={true}
      >
        <CreateServiceForm
          onCancel={() => setOpen(false)}
          onSuccess={() => setOpen(false)}
        />
      </Modal>
    </div>
  )
}
