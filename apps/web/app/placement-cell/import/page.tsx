'use client';

import * as React from 'react';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileSpreadsheet, AlertTriangle, CheckCircle, Download } from 'lucide-react';
import { ImportJobStatus, ImportJobType } from '@campusedge/shared';

interface Company {
  id: string;
  name: string;
}

interface SampleImportRow {
  rowNumber?: number;
  company_name?: string;
  season_label?: string;
  title?: string;
  role_title?: string;
  ctc_min_lpa?: number | string;
  ctc_max_lpa?: number | string;
  selected_count?: number | string | null;
  [key: string]: unknown;
}

interface ImportPreview {
  id: string;
  status: ImportJobStatus;
  type: ImportJobType;
  totalRows: number;
  validRows: number;
  errorCount: number;
  unmappedCompanies: string[];
  companyMappings: Record<string, { resolvedCompanyId: string | null; createNew: boolean }>;
  sampleRows: SampleImportRow[];
}

export default function HistoricalImportPage() {
  const [file, setFile] = React.useState<File | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Flow State
  const [jobId, setJobId] = React.useState<string | null>(null);
  const [preview, setPreview] = React.useState<ImportPreview | null>(null);
  const [catalogCompanies, setCatalogCompanies] = React.useState<Company[]>([]);
  const [commitResult, setCommitResult] = React.useState<{
    createdDrivesCount: number;
    createdRolesCount: number;
  } | null>(null);

  // Fetch catalog companies for mapping
  React.useEffect(() => {
    api
      .get<{ items: Company[] }>('/companies?limit=100')
      .then((res) => setCatalogCompanies(res.items || []))
      .catch(console.error);
  }, []);

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    try {
      setLoading(true);
      setError(null);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', ImportJobType.HISTORICAL_DRIVES);

      const res = await api.upload<{ jobId: string }>('/imports/upload', formData);
      setJobId(res.jobId);
      await loadPreview(res.jobId);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const loadPreview = async (id: string) => {
    try {
      setLoading(true);
      const prev = await api.get<ImportPreview>(`/imports/${id}/preview`);
      setPreview(prev);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load preview');
    } finally {
      setLoading(false);
    }
  };

  const handleResolveCompany = async (
    rawName: string,
    resolvedCompanyId: string | null,
    createNew: boolean,
  ) => {
    if (!jobId) return;
    try {
      await api.post(`/imports/${jobId}/resolve-company`, {
        rawName,
        resolvedCompanyId,
        createNew,
      });
      await loadPreview(jobId);
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Company resolution failed');
    }
  };

  const handleCommit = async () => {
    if (!jobId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await api.post<{
        createdDrivesCount: number;
        createdRolesCount: number;
      }>(`/imports/${jobId}/commit`, {});
      setCommitResult(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to commit import data');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadErrors = async () => {
    const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000').replace(
      /\/+$/,
      '',
    );
    const baseUrl = API_BASE.endsWith('/api/v1') ? API_BASE : `${API_BASE}/api/v1`;
    window.open(`${baseUrl}/imports/${jobId}/errors.csv`, '_blank');
  };

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Historical Placement Data Import</h1>
        <p className="text-muted-foreground mt-1">
          Import past campus drives, offer distributions, and compensation benchmarks from CSV or
          Excel spreadsheets.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-md border border-destructive/50 bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Step 3: Success Confirmation */}
      {commitResult ? (
        <Card className="border-green-200 bg-green-50/50 p-8 text-center space-y-4">
          <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />
          <h2 className="text-2xl font-bold text-green-900">Import Committed Successfully!</h2>
          <p className="text-sm text-green-800">
            Successfully created {commitResult.createdDrivesCount} historical placement drives and{' '}
            {commitResult.createdRolesCount} roles in an atomic transaction.
          </p>
          <div className="flex justify-center gap-4 pt-4">
            <Button asChild>
              <Link href="/placement-cell/drives">View Drives</Link>
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setCommitResult(null);
                setPreview(null);
                setJobId(null);
                setFile(null);
              }}
            >
              Import Another File
            </Button>
          </div>
        </Card>
      ) : preview ? (
        /* Step 2: Preview & Resolution */
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Validation Summary</CardTitle>
              <CardDescription>
                Spreadsheet parsed and inspected with formula injection defense.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                <div className="p-4 rounded-lg bg-muted/40">
                  <div className="text-2xl font-bold">{preview.totalRows}</div>
                  <div className="text-xs text-muted-foreground">Total Rows Processed</div>
                </div>
                <div className="p-4 rounded-lg bg-green-50 text-green-900 border border-green-200">
                  <div className="text-2xl font-bold">{preview.validRows}</div>
                  <div className="text-xs text-green-700">Valid Rows Ready to Import</div>
                </div>
                <div className="p-4 rounded-lg bg-red-50 text-red-900 border border-red-200">
                  <div className="text-2xl font-bold">{preview.errorCount}</div>
                  <div className="text-xs text-red-700">Invalid Rows Found</div>
                </div>
              </div>

              {preview.errorCount > 0 && (
                <div className="mt-4 p-4 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                    <span>
                      {preview.errorCount} rows failed schema constraints (e.g. min CTC &gt; max
                      CTC, missing fields).
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleDownloadErrors}
                    className="flex items-center gap-1"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download Errors CSV</span>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Unmapped Companies Resolution */}
          {preview.unmappedCompanies.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Unmapped Recruiters ({preview.unmappedCompanies.length})</CardTitle>
                <CardDescription>
                  Map unrecognized recruiter names to existing catalog companies, or create them as
                  new profiles.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {preview.unmappedCompanies.map((rawName) => {
                  const mapping = preview.companyMappings[rawName] || {
                    resolvedCompanyId: null,
                    createNew: false,
                  };

                  return (
                    <div
                      key={rawName}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border gap-3"
                    >
                      <div className="font-medium text-sm">
                        <span className="text-muted-foreground">Spreadsheet Name: </span>
                        <span className="font-semibold text-foreground">"{rawName}"</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <select
                          value={mapping.resolvedCompanyId || ''}
                          onChange={(e) =>
                            handleResolveCompany(rawName, e.target.value || null, false)
                          }
                          aria-label={`Map ${rawName} to catalog`}
                          className="rounded-md border border-input bg-background px-3 py-1.5 text-xs shadow-sm"
                          disabled={mapping.createNew}
                        >
                          <option value="">Map to existing catalog company...</option>
                          {catalogCompanies.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>

                        <span className="text-xs text-muted-foreground">or</span>

                        <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                          <input
                            type="checkbox"
                            checked={mapping.createNew}
                            onChange={(e) => handleResolveCompany(rawName, null, e.target.checked)}
                            className="rounded"
                          />
                          <span>Create as New</span>
                        </label>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Sample Rows Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Sample Valid Data (First 5 Rows)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50 text-muted-foreground text-left border-b">
                    <tr>
                      <th className="p-2">Row</th>
                      <th className="p-2">Recruiter</th>
                      <th className="p-2">Season</th>
                      <th className="p-2">Title</th>
                      <th className="p-2">Role</th>
                      <th className="p-2">CTC Min</th>
                      <th className="p-2">CTC Max</th>
                      <th className="p-2">Placed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {preview.sampleRows.slice(0, 5).map((r, i) => (
                      <tr key={i}>
                        <td className="p-2 font-mono">{r.rowNumber}</td>
                        <td className="p-2 font-medium">{r.company_name}</td>
                        <td className="p-2">{r.season_label}</td>
                        <td className="p-2">{r.title}</td>
                        <td className="p-2">{r.role_title}</td>
                        <td className="p-2">₹{r.ctc_min_lpa} LPA</td>
                        <td className="p-2">₹{r.ctc_max_lpa} LPA</td>
                        <td className="p-2">{r.selected_count ?? '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Commit Action */}
          <div className="flex justify-between items-center pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setPreview(null);
                setJobId(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCommit}
              disabled={loading || preview.validRows === 0}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
            >
              <CheckCircle className="h-4 w-4" />
              <span>
                {loading ? 'Committing...' : `Commit ${preview.validRows} Drives to Database`}
              </span>
            </Button>
          </div>
        </div>
      ) : (
        /* Step 1: Upload File */
        <Card>
          <CardHeader>
            <CardTitle>Upload Spreadsheet</CardTitle>
            <CardDescription>
              Accepts .csv and .xlsx files up to 5 MB (maximum 2,000 rows).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleFileUpload} className="space-y-6">
              <div className="border-2 border-dashed rounded-lg p-8 text-center space-y-4 hover:border-primary/50 transition-colors">
                <FileSpreadsheet className="h-12 w-12 text-muted-foreground mx-auto" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    {file ? file.name : 'Choose a CSV or Excel spreadsheet'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Headers: company_name, season_label, title, role_title, ctc_min_lpa, ctc_max_lpa
                  </p>
                </div>
                <input
                  type="file"
                  accept=".csv, .xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, text/csv"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="spreadsheet-file"
                />
                <Button asChild variant="outline" size="sm">
                  <label htmlFor="spreadsheet-file" className="cursor-pointer">
                    Browse File
                  </label>
                </Button>
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={!file || loading}
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  <span>{loading ? 'Uploading & Parsing...' : 'Upload & Validate'}</span>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
