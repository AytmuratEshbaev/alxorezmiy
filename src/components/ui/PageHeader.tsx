import Breadcrumbs, { type Crumb } from './Breadcrumbs';

/** Ichki sahifalar sarlavhasi: yagona <h1> + breadcrumb. */
export default function PageHeader({
  title,
  titleLang,
  crumbs,
}: {
  title: string;
  titleLang?: string;
  crumbs: Crumb[];
}) {
  return (
    <div className="page-header">
      <h1 lang={titleLang}>{title}</h1>
      <Breadcrumbs items={crumbs} />
    </div>
  );
}
