import Badge from './Badge';

const RISK_COLOR = { Low: 'emerald', Medium: 'amber', High: 'rose' };

export default function RiskBadge({ risk }) {
  return <Badge color={RISK_COLOR[risk] || 'slate'}>{risk} risk</Badge>;
}
