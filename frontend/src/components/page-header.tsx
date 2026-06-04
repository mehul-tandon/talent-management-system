interface PageHeaderProps {
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <header className="page-header">
      <div>
        <p className="eyebrow">Operations</p>
        <h1>{title}</h1>
        <p className="muted-copy">{description}</p>
      </div>
      {action ? <div>{action}</div> : null}
    </header>
  );
}
