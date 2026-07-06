type Labels = Record<string, string | number | boolean>;

type MetricSeries = {
  name: string;
  help: string;
  type: 'counter' | 'gauge';
  labels: Record<string, string>;
  value: number;
};

class MetricsRegistry {
  private readonly series = new Map<string, MetricSeries>();

  increment(name: string, help: string, labels: Labels = {}, value = 1) {
    const series = this.getOrCreate(name, help, 'counter', labels);
    series.value += value;
  }

  gauge(name: string, help: string, labels: Labels, value: number) {
    const series = this.getOrCreate(name, help, 'gauge', labels);
    series.value = Number.isFinite(value) ? value : 0;
  }

  observeHttpDuration(seconds: number, labels: Labels) {
    const buckets = [0.05, 0.1, 0.15, 0.3, 0.5, 1, 2, 5];
    for (const bucket of buckets) {
      if (seconds <= bucket) {
        this.increment(
          'todo_http_request_duration_seconds_bucket',
          'HTTP request latency buckets in seconds',
          { ...labels, le: bucket },
        );
      }
    }
    this.increment(
      'todo_http_request_duration_seconds_bucket',
      'HTTP request latency buckets in seconds',
      { ...labels, le: '+Inf' },
    );
    this.increment(
      'todo_http_request_duration_seconds_count',
      'HTTP request latency observation count',
      labels,
    );
    this.increment(
      'todo_http_request_duration_seconds_sum',
      'HTTP request latency observation sum',
      labels,
      seconds,
    );
  }

  render() {
    const grouped = new Map<string, MetricSeries[]>();
    for (const series of this.series.values()) {
      const group = grouped.get(series.name) ?? [];
      group.push(series);
      grouped.set(series.name, group);
    }
    const lines: string[] = [];
    for (const [name, series] of [...grouped.entries()].sort(([a], [b]) =>
      a.localeCompare(b),
    )) {
      const first = series[0]!;
      lines.push(`# HELP ${name} ${first.help}`);
      lines.push(`# TYPE ${name} ${first.type}`);
      for (const item of series.sort((a, b) =>
        labelKey(a.labels).localeCompare(labelKey(b.labels)),
      )) {
        const labels = Object.entries(item.labels)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([key, value]) => `${key}="${escapeLabel(value)}"`)
          .join(',');
        lines.push(`${name}${labels ? `{${labels}}` : ''} ${item.value}`);
      }
    }
    return `${lines.join('\n')}\n`;
  }

  reset() {
    this.series.clear();
  }

  private getOrCreate(
    name: string,
    help: string,
    type: 'counter' | 'gauge',
    labels: Labels,
  ) {
    const normalized = Object.fromEntries(
      Object.entries(labels).map(([key, value]) => [key, String(value)]),
    );
    const key = `${name}|${labelKey(normalized)}`;
    const existing = this.series.get(key);
    if (existing) return existing;
    const created: MetricSeries = {
      name,
      help,
      type,
      labels: normalized,
      value: 0,
    };
    this.series.set(key, created);
    return created;
  }
}

export const metrics = new MetricsRegistry();

export function metricPath(value: string) {
  return value
    .split('?')[0]!
    .replace(
      /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi,
      ':id',
    )
    .replace(/\/\d+(?=\/|$)/g, '/:id');
}

function labelKey(labels: Record<string, string>) {
  return Object.entries(labels)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('|');
}

function escapeLabel(value: string) {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n');
}
