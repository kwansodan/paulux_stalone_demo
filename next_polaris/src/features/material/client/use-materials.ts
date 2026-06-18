import { api } from "@/lib/api"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  SerializedMaterial,
  SerializedSection,
  MaterialMovementRow,
  SectionUsageReport,
} from "../types"
import { MaterialMovementInput } from "../utils/validation"

const MATERIALS_KEY = ["materials"]
const SECTIONS_KEY = ["sections"]

export function useGetMaterials() {
  return useQuery<SerializedMaterial[]>({
    queryKey: MATERIALS_KEY,
    queryFn: async () => (await api.get("/materials")).data.data,
  })
}

export function useUpsertMaterial() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => (await api.post("/materials", payload)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: MATERIALS_KEY })
      toast.success("Material saved")
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || "Failed to save material"),
  })
}

export function useDeleteMaterial() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => (await api.delete(`/materials/${id}`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: MATERIALS_KEY })
      toast.success("Material deleted")
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || "Failed to delete material"),
  })
}

export function useToggleMaterialStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) =>
      (await api.post(`/materials/${id}/status`, { isActive })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: MATERIALS_KEY }),
    onError: (error: any) => toast.error(error?.response?.data?.message || "Failed to update status"),
  })
}

export function useGetMaterialMovements(materialId: string | null) {
  return useQuery<MaterialMovementRow[]>({
    queryKey: ["material-movements", materialId],
    queryFn: async () => (await api.get(`/materials/${materialId}/movements`)).data.data,
    enabled: !!materialId,
  })
}

export function useRecordMaterialMovement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ materialId, ...payload }: MaterialMovementInput & { materialId: string }) =>
      (await api.post(`/materials/${materialId}/movements`, payload)).data,
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["material-movements", variables.materialId] })
      qc.invalidateQueries({ queryKey: MATERIALS_KEY })
      toast.success("Movement recorded")
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || "Failed to record movement"),
  })
}

export function useGetSections(activeOnly = false) {
  return useQuery<SerializedSection[]>({
    queryKey: [...SECTIONS_KEY, { activeOnly }],
    queryFn: async () => (await api.get(`/sections${activeOnly ? "?activeOnly=true" : ""}`)).data.data,
  })
}

export function useCreateSection() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { name: string }) => (await api.post("/sections", payload)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SECTIONS_KEY })
      toast.success("Section added")
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || "Failed to add section"),
  })
}

export function useSeedSections() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => (await api.post("/sections/seed")).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SECTIONS_KEY })
      toast.success("Sections ready")
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || "Failed to set up sections"),
  })
}

export function useGetUsageReport(from: string, to: string) {
  return useQuery<SectionUsageReport>({
    queryKey: ["material-usage", from, to],
    queryFn: async () => (await api.get(`/materials/usage?from=${from}&to=${to}`)).data.data,
    enabled: !!from && !!to,
  })
}
