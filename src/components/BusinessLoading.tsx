type BusinessLoadingProps = {
  message?: string
}

export function BusinessLoading({ message = 'Fetching data…' }: BusinessLoadingProps) {
  return (
    <main className="booking-shell">
      <div className="status-panel" role="status">
        <span className="loader" aria-hidden="true" />
        <span>{message}</span>
      </div>
    </main>
  )
}
