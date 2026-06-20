import { sortTags, tagMeta } from 'src/front-components/shared/tag-meta';

// Компактные чипы тегов записи (W3-2, Kimai tags). Цвет/ярлык — из SSOT
// (ENTRY_TAG_OPTIONS через tag-meta). Если тегов нет — ничего не рендерим.

type Props = {
  tags: string[] | null | undefined;
};

export const TagChips = ({ tags }: Props) => {
  if (!tags || tags.length === 0) return null;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 4, marginTop: 3 }}>
      {sortTags(tags).map((code) => {
        const m = tagMeta(code);
        return (
          <span
            key={code}
            title={m.label}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              maxWidth: '100%',
              padding: '1px 7px',
              borderRadius: 999,
              fontSize: 10,
              lineHeight: 1.5,
              fontWeight: 600,
              color: m.solid,
              background: m.tint,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            <span
              aria-hidden
              style={{ width: 5, height: 5, borderRadius: '50%', flexShrink: 0, background: m.solid }}
            />
            {m.label}
          </span>
        );
      })}
    </div>
  );
};
