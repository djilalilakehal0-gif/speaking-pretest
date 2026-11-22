export function PageTitle({ title, sub }: { title: string; sub?: string }) {
  return (<div className="page-title"><div className="wrap"><h1>{title}</h1>{sub && <p>{sub}</p>}</div></div>);
}
