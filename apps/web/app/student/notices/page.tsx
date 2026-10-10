'use client';

import * as React from 'react';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Pin, Paperclip, Bell, Calendar } from 'lucide-react';

interface NoticeItem {
  id: string;
  title: string;
  body: string;
  isPinned: boolean;
  publishedAt: string | null;
  attachments: { id: string; fileName: string; sizeBytes: number }[];
}

export default function StudentNoticesPage() {
  const [notices, setNotices] = React.useState<NoticeItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchNotices = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<{ items: NoticeItem[] }>('/notices?limit=50');
      setNotices(res.items || []);
    } catch (err) {
      setError((err as Error).message || 'Failed to load notices');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchNotices();
  }, [fetchNotices]);

  const handleDownloadAttachment = async (noticeId: string, attachmentId: string) => {
    try {
      const res = await api.get<{ signedUrl: string; fileName: string }>(
        `/notices/${noticeId}/attachments/${attachmentId}/signed-url`,
      );
      window.open(res.signedUrl, '_blank');
    } catch (err) {
      alert((err as Error).message || 'Failed to download attachment');
    }
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Placement Notice Board</h1>
        <p className="text-muted-foreground mt-1">
          Official announcements, interview schedules, and placement cell updates.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-md border border-destructive/50 bg-destructive/10 text-destructive text-sm flex items-center justify-between gap-3">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => fetchNotices()}
            className="rounded border border-destructive px-2.5 py-1 text-xs font-medium hover:bg-destructive/20 transition-colors flex-shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center p-12 text-muted-foreground">Loading notices...</div>
      ) : notices.length === 0 ? (
        <Card className="text-center p-12">
          <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">No New Announcements</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Check back later for updates from your placement cell.
          </p>
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
                    {notice.publishedAt && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(notice.publishedAt).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                  {notice.body}
                </div>

                {notice.attachments && notice.attachments.length > 0 && (
                  <div className="pt-2 border-t flex flex-wrap gap-2">
                    {notice.attachments.map((att) => (
                      <button
                        key={att.id}
                        type="button"
                        onClick={() => handleDownloadAttachment(notice.id, att.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs border bg-muted/30 hover:bg-muted text-primary transition-colors"
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
    </div>
  );
}
