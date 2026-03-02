export function BackgroundDecor() {
    return (
        <>
            {/* Sky */}
            <div className="bg-layer" aria-hidden="true">
                <div className="cloud cl1" />
                <div className="cloud cl2" />
                <div className="cloud cl3" />
                <div className="cloud cl4" />
                <div className="sun" />
            </div>

            {/* Flowers */}
            <div className="flowers" aria-hidden="true">
                <span className="flower f1">🌸</span>
                <span className="flower f2">🌼</span>
                <span className="flower f3">🌷</span>
                <span className="flower f4">🌻</span>
                <span className="flower f5">🌺</span>
                <span className="flower f6">🌸</span>
                <span className="flower f7">🌼</span>

                <span className="flower f8">🌷</span>
                <span className="flower f9">🌻</span>
                <span className="flower f10">🌺</span>
                <span className="flower f11">🌸</span>
                <span className="flower f12">🌼</span>
                <span className="flower f13">🌷</span>
                <span className="flower f14">🌻</span>
            </div>
        </>
    )
}