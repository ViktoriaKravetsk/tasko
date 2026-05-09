type Props = {
    value: string
    onChange: (value: string) => void
    placeholder: string
}

export default function ProjectsSearchBar({ value, onChange, placeholder }: Props) {
    return (
        <div className="panel section-gap-md panel--compact">
            <div className="search-row">
                <input
                    className="inp search-row__input"
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    placeholder={placeholder}
                />

                {value.trim() ? (
                    <button type="button" className="btn btn--ghost" onClick={() => onChange('')}>
                        Clear
                    </button>
                ) : null}
            </div>
        </div>
    )
}