'use client';

import * as React from 'react';
import { api, ApiError } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { Pin, Plus, Paperclip, Archive, Trash2, FileText } from 'lucide-react';
import { NoticeAudience, NoticeStatus } from '@campusedge/shared';

interface NoticeItem {
  id: string;
  title: string;
  body: string;
  audience: NoticeAudience;
  status: NoticeStatus;
  isPinned: boolean;
  publishedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  drive?: { id: string; title: string; company: { name: string } } | null;
  attachments: { id: string; fileName: string; mimeType: string; sizeBytes: number }[];
}

export default function NoticesPage() {
  const [notices, setNotices] = React.useState<NoticeItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Dialog state
  const [createOpen, setCreateOpen] = React.useState(false);
  const [title, setTitle] = React.useState('');
  const [body, setBody] = React.useState('');
  const [audience, setAudience] = React.useState<NoticeAudience>(NoticeAudience.ALL);
  const [isPinned, setIsPinned] = React.useState(false);
  const [expiresAt, setExpiresAt] = React.useState('');
  const [file, setFile] = React.useState<File | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const fetchNotices = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<{ items: NoticeItem[] }>('/notices?limit=50');
      setNotices(res.items || []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load notices');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchNotices();
  }, [fetchNotices]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      // 1. Create notice record
      const notice = await api.post<{ id: string }>('/notices', {
        title: title.trim(),
        body: body.trim(),
        audience,
        isPinned,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
        status: NoticeStatus.PUBLISHED,
      });

      // 2. Upload attachment if attached
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        await api.upload(`/notices/${notice.id}/attachments`, formData);
      }

      setCreateOpen(false);
      setTitle('');
      setBody('');
      setFile(null);
      fetchNotices();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Failed to publish notice');
    } finally {
      setSubmitting(false);
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await api.post(`/notices/${id}/archive`, {});
      fetchNotices();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Failed to archive notice');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this notice?')) return;
    try {
      await api.delete(`/notices/${id}`);
      fetchNotices();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Failed to delete notice');
    }
  };

  const handleDownloadAttachment = async (noticeId: string, attachmentId: string) => {
    try {
      const res = await api.get<{ signedUrl: string; fileName: string }>(
        `/notices/${noticeId}/attachments/${attachmentId}/signed-url`,
      );
      window.open(res.signedUrl, '_blank');
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Failed to download attachment');
    }
  };

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notice Board</h1>
          <p className="text-muted-foreground mt-1">
            Broadcast official placement announcements, company updates, and policy guidelines.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          <span>New Notice</span>
        </Button>
      </div>

      {error && (
        <div className="p-4 rounded-md border border-destructive/50 bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center p-12 text-muted-foreground">Loading notices...</div>
      ) : notices.length === 0 ? (
        <Card className="text-center p-12">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">No Notices Published</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Post your first announcement to students.
          </p>
          <Button onClick={() => setCreateOpen(true)} className="mt-4">
            Create Notice
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {notices.map((notice) => (
            <Card
              key={notice.id}
              className={notice.isPinned ? 'border-primary/60 bg-primary/[0.02] shadow-sm' : ''}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {notice.isPinned && (
                        <span className="flex items-center text-xs font-semibold text-primary">
                          <Pin className="h-3.5 w-3.5 mr-1 fill-primary" />
                          Pinned
                        </span>
                      )}
                      <CardTitle className="text-lg">{notice.title}</CardTitle>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline">{notice.audience}</Badge>
                      <Badge
                        variant={
                          notice.status === NoticeStatus.PUBLISHED
                            ? 'default'
                            : notice.status === NoticeStatus.ARCHIVED
                              ? 'secondary'
                              : 'outline'
                        }
                      >
                        {notice.status}
                      </Badge>
                      {notice.publishedAt && (
                        <span>Published: {new Date(notice.publishedAt).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {notice.status === NoticeStatus.PUBLISHED && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleArchive(notice.id)}
                        title="Archive notice"
                      >
                        <Archive className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => handleDelete(notice.id)}
                      title="Delete notice"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="text-sm whitespace-pre-wrap leading-relaxed text-foreground">
                  {notice.body}
                </div>

                {notice.attachments && notice.attachments.length > 0 && (
                  <div className="pt-2 border-t flex flex-wrap gap-2">
                    {notice.attachments.map((att) => (
                      <button
                        key={att.id}
                        type="button"
                        onClick={() => handleDownloadAttachment(notice.id, att.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs border bg-muted/30 hover:bg-muted transition-colors text-primary"
                      >
                        <Paperclip className="h-3.5 w-3.5" />
                        <span>{att.fileName}</span>
                        <span className="text-muted-foreground">
                          ({(att.sizeBytes / 1024).toFixed(0)} KB)
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Post New Announcement"
        description="Write and publish an announcement to college students."
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="noticeTitle">Notice Title *</Label>
            <Input
              id="noticeTitle"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Schedule for TCS Digital Interview Rounds"
              required
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="noticeBody">Notice Body (Markdown supported) *</Label>
            <textarea
              id="noticeBody"
              rows={5}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Enter announcement details, instructions, or venue details..."
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="audienceSelect">Target Audience</Label>
              <select
                id="audienceSelect"
                value={audience}
                onChange={(e) => setAudience(e.target.value as NoticeAudience)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
              >
                <option value={NoticeAudience.ALL}>All Students</option>
                <option value={NoticeAudience.BY_BRANCH}>Targeted Branches</option>
                <option value={NoticeAudience.BY_BATCH_YEAR}>Targeted Batch Year</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="expiryInput">Expiration Date (Optional)</Label>
              <Input
                id="expiryInput"
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="attachmentInput">
              File Attachment (PDF, DOCX, XLSX, PNG, JPG &lt; 10 MB)
            </Label>
            <Input
              id="attachmentInput"
              type="file"
              accept=".pdf,.docx,.xlsx,.png,.jpg,.jpeg"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="pinCheck"
              checked={isPinned}
              onChange={(e) => setIsPinned(e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="pinCheck" className="cursor-pointer">
              Pin notice to top of board
            </Label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Publishing...' : 'Publish Announcement'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
