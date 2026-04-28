"use client"

import axios from "axios"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { SerializedPackage } from "../types"

const QUERY_KEY = ["packages"]

export function useGetPackages() {
  return useQuery<SerializedPackage[]>({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const { data } = await axios.get("/api/packages")
      return data.data
    },
  })
}

export function useCreatePackage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      name: string
      description?: string
      imageUrl?: string | null
      price: number
      minDepositFixed: number
      isActive: boolean
      serviceIds: string[]
    }) => {
      const { data } = await axios.post("/api/packages", payload)
      return data.data as SerializedPackage
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}

export function useUpdatePackage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...payload }: {
      id: string
      name?: string
      description?: string | null
      imageUrl?: string | null
      price?: number
      minDepositFixed?: number
      isActive?: boolean
      serviceIds?: string[]
    }) => {
      const { data } = await axios.patch(`/api/packages/${id}`, payload)
      return data.data as SerializedPackage
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}

export function useDeletePackage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`/api/packages/${id}`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}
