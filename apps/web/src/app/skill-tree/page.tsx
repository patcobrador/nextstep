const nodes = [
  ["Make the Space Safe", "Mastered"],
  ["Ready Position", "Mastered"],
  ["Strong Right Bounces", "Practising"],
  ["Strong Left Bounces", "Practising"],
  ["Both Hands Check", "Locked — complete three practices across five days"],
  ["Walk and Dribble", "Locked — pass Both Hands Check"],
] as const;

export default function SkillTreePage() {
  return (
    <section className="content-card" aria-labelledby="skill-tree-heading">
      <p className="eyebrow">Foundation · Control First</p>
      <h1 id="skill-tree-heading">Skill Tree &amp; Progress</h1>
      <p>
        The list below is the accessible pathway view. Locked skills explain
        why.
      </p>
      <ol className="skill-list">
        {nodes.map(([name, status]) => (
          <li key={name}>
            <span>{name}</span>
            <strong>{status}</strong>
          </li>
        ))}
      </ol>
    </section>
  );
}
