export default function PracticePage() {
  return (
    <section
      className="content-card practice-card"
      aria-labelledby="practice-heading"
    >
      <p className="eyebrow">Guided practice · 20 minutes</p>
      <h1 id="practice-heading">Both-hand ball control</h1>
      <p className="safety-note">
        Before starting: use a dry, clear surface and stop if pain occurs.
      </p>
      <div className="cue-grid">
        <div>
          <h2>Parent cue</h2>
          <p>Give one cue at a time and stop when control deteriorates.</p>
        </div>
        <div>
          <h2>Athlete cues</h2>
          <p>Bend · Bounce hard · Eyes forward</p>
        </div>
      </div>
      <button className="primary-action" type="button">
        Begin guided session
      </button>
    </section>
  );
}
