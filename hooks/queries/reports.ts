import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { Report, CreateReportDTO, ResourceType, ReportReason } from "@/types/report";
import { queryKeys } from "./keys";

async function fetchMyReports(): Promise<Report[]> {
  const { data } = await api.get<{ data: Report[] }>("/reports/my");
  return data.data;
}

async function createReport(dto: CreateReportDTO): Promise<Report> {
  // Remove undefined values to avoid sending them in the payload
  const payload = Object.fromEntries(
    Object.entries(dto).filter(([_, v]) => v !== undefined)
  );
  const { data } = await api.post<{ data: Report }>("/reports", payload);
  return data.data;
}

async function deleteReport(reportId: string): Promise<void> {
  await api.delete(`/reports/${reportId}`);
}

export function useMyReports() {
  return useQuery({
    queryKey: queryKeys.myReports,
    queryFn: fetchMyReports,
  });
}

export function useReportUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      userId,
      reason,
      description,
    }: {
      userId: string;
      reason: ReportReason;
      description?: string;
    }) =>
      createReport({
        resourceType: "user",
        resourceId: userId,
        reason,
        description,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.myReports });
    },
  });
}

export function useReportList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      listId,
      reason,
      description,
    }: {
      listId: string | number;
      reason: ReportReason;
      description?: string;
    }) =>
      createReport({
        resourceType: "list",
        resourceId: String(listId),
        reason,
        description,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.myReports });
    },
  });
}

export function useDeleteReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (reportId: string) => deleteReport(reportId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.myReports });
    },
  });
}

