import type {
  TriageItem,
  TriageCluster,
  TriageSeverity,
  CIFailureData,
  ErrorLogData,
  GitHubIssueData,
  UserFeedbackData,
} from '@/types/triage';

/**
 * Calculate similarity score between two strings using Jaccard similarity
 */
function calculateSimilarity(str1: string, str2: string): number {
  const tokens1 = new Set(str1.toLowerCase().split(/\s+/));
  const tokens2 = new Set(str2.toLowerCase().split(/\s+/));

  const intersection = new Set([...tokens1].filter(x => tokens2.has(x)));
  const union = new Set([...tokens1, ...tokens2]);

  return union.size === 0 ? 0 : intersection.size / union.size;
}

/**
 * Extract key terms from text for pattern detection
 */
function extractKeyTerms(text: string): string[] {
  const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might', 'can']);

  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3 && !commonWords.has(word));

  const frequency: Record<string, number> = {};
  words.forEach(word => {
    frequency[word] = (frequency[word] || 0) + 1;
  });

  return Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);
}

/**
 * Detect severity based on content analysis
 */
export function detectSeverity(
  title: string,
  description: string,
  metadata: Record<string, unknown>
): TriageSeverity {
  const text = `${title} ${description}`.toLowerCase();

  // Critical indicators
  if (
    /critical|crash|data loss|security|breach|exploit|down|outage|production/i.test(text) ||
    metadata.environment === 'production'
  ) {
    return 'critical';
  }

  // High severity indicators
  if (
    /error|fail|broken|urgent|blocker|regression|memory leak/i.test(text) ||
    metadata.severity === 'error'
  ) {
    return 'high';
  }

  // Medium severity indicators
  if (
    /bug|issue|problem|incorrect|unexpected|warning/i.test(text)
  ) {
    return 'medium';
  }

  // Low severity indicators
  if (
    /minor|cosmetic|improvement|enhancement|typo/i.test(text)
  ) {
    return 'low';
  }

  return 'info';
}

/**
 * Suggest tags based on content analysis
 */
export function suggestTags(title: string, description: string, source: string): string[] {
  const text = `${title} ${description}`.toLowerCase();
  const tags: string[] = [];

  // Source-based tags
  tags.push(source);

  // Technology tags
  if (/react|jsx|tsx|component/i.test(text)) tags.push('react');
  if (/api|endpoint|route|http/i.test(text)) tags.push('api');
  if (/database|sql|query|migration/i.test(text)) tags.push('database');
  if (/auth|login|signup|session/i.test(text)) tags.push('auth');
  if (/ui|ux|interface|design|css/i.test(text)) tags.push('ui');
  if (/test|testing|spec|jest/i.test(text)) tags.push('testing');
  if (/deploy|ci\/cd|build|pipeline/i.test(text)) tags.push('deployment');
  if (/performance|slow|optimization|speed/i.test(text)) tags.push('performance');
  if (/security|xss|csrf|injection/i.test(text)) tags.push('security');

  // Type tags
  if (/bug|error|fail|broken/i.test(text)) tags.push('bug');
  if (/feature|enhancement|improvement/i.test(text)) tags.push('enhancement');
  if (/documentation|docs|readme/i.test(text)) tags.push('docs');

  return [...new Set(tags)]; // Remove duplicates
}

/**
 * Suggest owner based on content analysis
 */
export function suggestOwner(
  title: string,
  description: string,
  tags: string[],
  agents: Array<{ id: string; name: string; description?: string }>
): string | undefined {
  const text = `${title} ${description} ${tags.join(' ')}`.toLowerCase();

  // Simple keyword matching for agent specialization
  for (const agent of agents) {
    const agentKeywords = agent.description?.toLowerCase() || agent.name.toLowerCase();

    // Check if agent description matches content
    if (agentKeywords.includes('react') && /react|ui|component|frontend/i.test(text)) {
      return agent.id;
    }
    if (agentKeywords.includes('api') && /api|backend|server|database/i.test(text)) {
      return agent.id;
    }
    if (agentKeywords.includes('devops') && /deploy|ci|cd|infrastructure/i.test(text)) {
      return agent.id;
    }
    if (agentKeywords.includes('mobile') && /mobile|ios|android|app/i.test(text)) {
      return agent.id;
    }
  }

  return undefined;
}

/**
 * Extract reproduction steps from error logs or CI failures
 */
export function extractReproductionSteps(
  source: string,
  rawData: Record<string, unknown>
): string[] {
  const steps: string[] = [];

  if (source === 'ci_failure') {
    const ciData = rawData as unknown as CIFailureData;
    steps.push(`1. Checkout branch: ${ciData.branch}`);
    steps.push(`2. Checkout commit: ${ciData.commit}`);
    steps.push(`3. Run CI job: ${ciData.jobName}`);
    steps.push(`4. Observe failure: ${ciData.errorMessage}`);
  } else if (source === 'error_log') {
    const errorData = rawData as unknown as ErrorLogData;
    steps.push(`1. Navigate to the affected page or feature`);
    if (errorData.context) {
      Object.entries(errorData.context).forEach(([key, value]) => {
        steps.push(`2. Set ${key} to ${JSON.stringify(value)}`);
      });
    }
    steps.push(`3. Error occurs: ${errorData.message}`);
  } else if (source === 'github_issue') {
    const githubData = rawData as unknown as GitHubIssueData;
    // Try to extract numbered steps from issue body
    const bodySteps = githubData.body?.match(/\d+\.\s+.+/g);
    if (bodySteps && bodySteps.length > 0) {
      steps.push(...bodySteps);
    } else {
      steps.push('1. See original issue for details');
      steps.push(`2. Issue URL: ${githubData.url}`);
    }
  }

  return steps.length > 0 ? steps : ['Reproduction steps not available'];
}

/**
 * Cluster similar triage items
 */
export function clusterTriageItems(
  items: TriageItem[],
  similarityThreshold: number = 0.3
): TriageCluster[] {
  const clusters: TriageCluster[] = [];
  const clustered = new Set<string>();

  for (let i = 0; i < items.length; i++) {
    if (clustered.has(items[i].id)) continue;

    const cluster: TriageCluster = {
      id: `cluster-${Date.now()}-${i}`,
      userId: items[i].userId,
      title: items[i].title,
      description: items[i].description,
      itemIds: [items[i].id],
      severity: items[i].severity,
      suggestedOwner: items[i].suggestedOwner,
      commonPatterns: extractKeyTerms(`${items[i].title} ${items[i].description}`),
      reproductionSteps: items[i].reproductionSteps,
      tags: items[i].tags,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    clustered.add(items[i].id);

    // Find similar items
    for (let j = i + 1; j < items.length; j++) {
      if (clustered.has(items[j].id)) continue;

      const similarity = calculateSimilarity(
        `${items[i].title} ${items[i].description}`,
        `${items[j].title} ${items[j].description}`
      );

      if (similarity >= similarityThreshold) {
        cluster.itemIds.push(items[j].id);
        clustered.add(items[j].id);

        // Merge common patterns
        const newPatterns = extractKeyTerms(`${items[j].title} ${items[j].description}`);
        cluster.commonPatterns = [
          ...new Set([...cluster.commonPatterns, ...newPatterns])
        ].slice(0, 10);

        // Merge tags
        cluster.tags = [...new Set([...cluster.tags, ...items[j].tags])];

        // Upgrade severity if needed
        const severityOrder: TriageSeverity[] = ['info', 'low', 'medium', 'high', 'critical'];
        if (severityOrder.indexOf(items[j].severity) > severityOrder.indexOf(cluster.severity)) {
          cluster.severity = items[j].severity;
        }
      }
    }

    // Only create cluster if it has multiple items
    if (cluster.itemIds.length > 1) {
      cluster.title = `Cluster: ${cluster.commonPatterns.slice(0, 3).join(', ')}`;
      cluster.description = `${cluster.itemIds.length} related items found`;
      clusters.push(cluster);
    }
  }

  return clusters;
}

/**
 * Find duplicate items
 */
export function findDuplicates(
  newItem: TriageItem,
  existingItems: TriageItem[],
  duplicateThreshold: number = 0.7
): TriageItem | undefined {
  const newText = `${newItem.title} ${newItem.description}`;

  for (const existing of existingItems) {
    if (existing.status === 'duplicate' || existing.status === 'ignored') {
      continue;
    }

    const existingText = `${existing.title} ${existing.description}`;
    const similarity = calculateSimilarity(newText, existingText);

    if (similarity >= duplicateThreshold) {
      return existing;
    }
  }

  return undefined;
}

/**
 * Analyze and enrich a triage item with metadata
 */
export function analyzeTriageItem(
  item: Partial<TriageItem>,
  existingItems: TriageItem[],
  agents: Array<{ id: string; name: string; description?: string }>
): Partial<TriageItem> {
  const title = item.title || '';
  const description = item.description || '';
  const metadata = item.metadata || {};

  // Detect severity if not provided
  if (!item.severity) {
    item.severity = detectSeverity(title, description, metadata);
  }

  // Suggest tags if not provided
  if (!item.tags || item.tags.length === 0) {
    item.tags = suggestTags(title, description, item.source || 'manual');
  }

  // Suggest owner if not provided
  if (!item.suggestedOwner && agents.length > 0) {
    item.suggestedOwner = suggestOwner(title, description, item.tags, agents);
  }

  // Extract reproduction steps if not provided
  if (!item.reproductionSteps && item.source && item.rawData) {
    item.reproductionSteps = extractReproductionSteps(item.source, item.rawData);
  }

  // Check for duplicates
  if (existingItems.length > 0) {
    const duplicate = findDuplicates(item as TriageItem, existingItems);
    if (duplicate) {
      item.status = 'duplicate';
      item.duplicateOfId = duplicate.id;
    }
  }

  return item;
}
