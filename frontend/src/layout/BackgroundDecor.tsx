export function BackgroundDecor() {
    return (
        <>
            <div className="bg-sky" aria-hidden="true">
                <div className="cloud cl1" />
                <div className="cloud cl2" />
                <div className="cloud cl3" />
                <div className="cloud cl4" />

                <div className="sun" />

                <span className="float-dot fd1" />
                <span className="float-dot fd2" />
                <span className="float-dot fd3" />
                <span className="float-dot fd4" />
                <span className="float-dot fd5" />
                <span className="float-dot fd6" />

                <span className="flower-drop flower-drop--1">🌸</span>
                <span className="flower-drop flower-drop--2">🌸</span>
                <span className="flower-drop flower-drop--3">🌼</span>
                <span className="flower-drop flower-drop--4">🌸</span>
            </div>

            <div className="bg-ground" aria-hidden="true">
                <div className="hill hill--back" />
                <div className="hill hill--front" />

                <div className="tree tree--l1">
                    <div className="tree__crown" />
                    <div className="tree__trunk" />
                </div>

                <div className="tree tree--l2 tree--small">
                    <div className="tree__crown" />
                    <div className="tree__trunk" />
                </div>

                <div className="tree tree--r1">
                    <div className="tree__crown" />
                    <div className="tree__trunk" />
                </div>

                <div className="tree tree--r2 tree--small">
                    <div className="tree__crown" />
                    <div className="tree__trunk" />
                </div>

                <div className="flowers" aria-hidden="true">
                    <div className="flower f1"><div className="head" /><div className="stem" /></div>
                    <div className="flower f2"><div className="head" /><div className="stem" /></div>
                    <div className="flower f3"><div className="head" /><div className="stem" /></div>
                    <div className="flower f4"><div className="head" /><div className="stem" /></div>
                    <div className="flower f5"><div className="head" /><div className="stem" /></div>
                    <div className="flower f6"><div className="head" /><div className="stem" /></div>
                    <div className="flower f7"><div className="head" /><div className="stem" /></div>
                    <div className="flower f8"><div className="head" /><div className="stem" /></div>
                    <div className="flower f9"><div className="head" /><div className="stem" /></div>
                    <div className="flower f10"><div className="head" /><div className="stem" /></div>
                    <div className="flower f11"><div className="head" /><div className="stem" /></div>
                    <div className="flower f12"><div className="head" /><div className="stem" /></div>
                </div>
            </div>
        </>
    )
}