"use client"

import axios from "axios"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

export interface StyleImage {
  id: string
  url: string
  objectName: string
  caption: string | null
  sortOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

const QUERY_KEY = ["style-images"]

// ── Queries ──────────────────────────────────────────────────────────────────

export function useGetStyleImages({ all = false }: { all?: boolean } = {}) {
  return useQuery<StyleImage[]>({
    queryKey: [...QUERY_KEY, { all }],
    queryFn: async () => {
      const url = all ? "/api/style-images?all=true" : "/api/style-images"
      const { data } = await axios.get(url)
      return data.data
    },
  })
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export function useCreateStyleImage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      url: string
      objectName: string
      caption?: string
    }) => {
      const { data } = await axios.post("/api/style-images", payload)
      return data.data as StyleImage
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}

export function useUpdateStyleImage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      ...payload
    }: {
      id: string
      caption?: string | null
      sortOrder?: number
      isActive?: boolean
    }) => {
      const { data } = await axios.patch(`/api/style-images/${id}`, payload)
      return data.data as StyleImage
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}

export function useDeleteStyleImage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`/api/style-images/${id}`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}
