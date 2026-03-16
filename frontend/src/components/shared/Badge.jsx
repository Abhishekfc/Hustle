import './Badge.css'

const CAT_COLORS = {
  UGC: 'blue', MUSIC: 'purple', CLIPPING: 'orange', LOGO: 'green', OTHER: 'gray',
}

function Badge({ label, variant }) {
  const color = variant || CAT_COLORS[label] || 'gray'
  return <span className={`cat-badge cat-badge-${color}`}>{label}</span>
}

export default Badge
