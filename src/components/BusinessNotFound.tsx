type BusinessNotFoundProps = {
  businessSlug: string
}

export function BusinessNotFound({ businessSlug }: BusinessNotFoundProps) {
  return (
    <main className="booking-shell">
      <div className="booking-panel">
        <section className="booking-content" role="alert">
          <p className="eyebrow">BUSINESS NOT FOUND</p>
          <h1>Business "{businessSlug}" does not exist.</h1>
          <a className="text-button" href="/">Return home</a>
        </section>
      </div>
    </main>
  )
}
