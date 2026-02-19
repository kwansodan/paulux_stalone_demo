'use client'
import Modal from "@/components/modal";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import CreateServiceForm from "./form/create-service-form";

export default function ServicesHeader() {
  const [open, setOpen] = useState(false)
  return (
    <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Services</h1>
        <p className="text-sm sm:text-[16px] text-gray-600">
          Manage Your Salon Services
        </p>
      </div>

      <Button
        className="bg-fuchsia-600 hover:bg-fuchsia-700"
        onClick={() => setOpen(true)}
      >
        + New Service
      </Button>

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
