export default function BookSkeleton() {
  return (
    <div style={{ width: '160px', flexShrink: 0 }}>
      <div style={{ width: '100%', height: '200px', background: 'rgba(255,255,255,0.06)', borderRadius: '12px', marginBottom: '12px', animation: 'pulse 1.5s infinite' }} />
      <div style={{ height: '12px', background: 'rgba(255,255,255,0.06)', borderRadius: '6px', marginBottom: '6px', animation: 'pulse 1.5s infinite' }} />
      <div style={{ height: '12px', background: 'rgba(255,255,255,0.04)', borderRadius: '6px', width: '70%', animation: 'pulse 1.5s infinite' }} />
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  )
}