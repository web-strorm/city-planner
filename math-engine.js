/**
 * Math Engine for City Planner
 * Handles Cartesian calculations, linear equations, inequalities, SPLDV, and step-by-step explanations.
 */
class MathEngine {
    /**
     * Calculates Euclidean distance between two points (x1, y1) and (x2, y2)
     */
    static distance(p1, p2) {
        return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
    }

    /**
     * Calculates Euclidean distance with full Pythagorean step-by-step breakdown
     */
    static distanceWithSteps(p1, p2) {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const dx2 = dx * dx;
        const dy2 = dy * dy;
        const sum = dx2 + dy2;
        const dist = Math.sqrt(sum);
        const distRounded = Math.round(dist * 100) / 100;

        return {
            dx,
            dy,
            dx2,
            dy2,
            sum,
            distance: distRounded,
            steps: [
                `Titik A(${p1.x}, ${p1.y}) dan Titik B(${p2.x}, ${p2.y})`,
                `Δx = x₂ - x₁ = ${p2.x} - ${p1.x} = ${dx}`,
                `Δy = y₂ - y₁ = ${p2.y} - ${p1.y} = ${dy}`,
                `Rumus Jarak / Teorema Pythagoras: d = √(Δx² + Δy²)`,
                `d = √(${dx}² + ${dy}²) = √(${dx2} + ${dy2}) = √${sum}`,
                `Jarak Nyata = ${distRounded} satuan koordinat`
            ]
        };
    }

    /**
     * Determines the quadrant of a point (1, 2, 3, 4 or 'origin' or 'axis')
     */
    static getQuadrant(x, y) {
        if (x === 0 && y === 0) return 'Pusat (0,0)';
        if (x === 0) return 'Sumbu Y';
        if (y === 0) return 'Sumbu X';
        if (x > 0 && y > 0) return 'Kuadran I (+, +)';
        if (x < 0 && y > 0) return 'Kuadran II (-, +)';
        if (x < 0 && y < 0) return 'Kuadran III (-, -)';
        if (x > 0 && y < 0) return 'Kuadran IV (+, -)';
        return 'Unknown';
    }

    /**
     * Calculates line equation through two points
     * Returns { m, c, isVertical, isHorizontal, xVal, equationStr, explanation }
     */
    static lineFromTwoPoints(p1, p2) {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;

        if (dx === 0 && dy === 0) {
            return null; // Same point
        }

        if (dx === 0) {
            return {
                isVertical: true,
                isHorizontal: false,
                xVal: p1.x,
                m: Infinity,
                c: null,
                equationStr: `x = ${p1.x}`,
                formattedStr: `x = ${p1.x}`,
                explanation: `Garis tegak (vertikal) melewati x = ${p1.x}. Gradien tak terdefinisi.`
            };
        }

        const m = dy / dx;
        const c = p1.y - m * p1.x;

        const mRounded = Math.round(m * 1000) / 1000;
        const cRounded = Math.round(c * 1000) / 1000;

        let eqStr = "y = ";
        if (m === 0) {
            eqStr = `y = ${cRounded}`;
        } else {
            const mText = m === 1 ? "" : m === -1 ? "-" : `${mRounded}`;
            eqStr += `${mText}x`;
            if (c > 0) eqStr += ` + ${cRounded}`;
            else if (c < 0) eqStr += ` - ${Math.abs(cRounded)}`;
        }

        return {
            isVertical: false,
            isHorizontal: m === 0,
            m: mRounded,
            c: cRounded,
            equationStr: eqStr,
            formattedStr: eqStr,
            explanation: `Gradien m = (y2 - y1) / (x2 - x1) = (${p2.y} - ${p1.y}) / (${p2.x} - ${p1.x}) = ${mRounded}.\nPersamaan: y - y1 = m(x - x1) ➔ ${eqStr}`
        };
    }

    /**
     * Generate parallel line equation: y = m*x + (c + deltaC)
     */
    static getParallelLine(line, deltaC = 2) {
        if (line.isVertical) {
            return {
                isVertical: true,
                xVal: line.xVal + deltaC,
                raw: `x = ${line.xVal + deltaC}`,
                name: `Jalan Sejajar: x = ${line.xVal + deltaC}`
            };
        }
        const newC = line.c + deltaC;
        const mStr = line.m === 1 ? 'x' : line.m === -1 ? '-x' : line.m === 0 ? '' : `${line.m}x`;
        const cStr = newC === 0 ? '' : newC > 0 ? ` + ${newC}` : ` - ${Math.abs(newC)}`;
        const raw = line.m === 0 ? `y = ${newC}` : `y = ${mStr}${cStr}`;
        return {
            isVertical: false,
            m: line.m,
            c: newC,
            raw,
            name: `Jalan Sejajar (${raw})`
        };
    }

    /**
     * Generate perpendicular line equation: m_perp = -1/m passing through point (px, py)
     */
    static getPerpendicularLine(line, pt = { x: 0, y: 0 }) {
        if (line.isVertical) {
            return {
                isVertical: false,
                m: 0,
                c: pt.y,
                raw: `y = ${pt.y}`,
                name: `Garis Tegak Lurus (y = ${pt.y})`
            };
        }
        if (line.m === 0) {
            return {
                isVertical: true,
                xVal: pt.x,
                raw: `x = ${pt.x}`,
                name: `Garis Tegak Lurus (x = ${pt.x})`
            };
        }

        const mPerp = -1 / line.m;
        const mRounded = Math.round(mPerp * 100) / 100;
        const cPerp = pt.y - mPerp * pt.x;
        const cRounded = Math.round(cPerp * 100) / 100;

        const mStr = mRounded === 1 ? 'x' : mRounded === -1 ? '-x' : `${mRounded}x`;
        const cStr = cRounded === 0 ? '' : cRounded > 0 ? ` + ${cRounded}` : ` - ${Math.abs(cRounded)}`;
        const raw = `y = ${mStr}${cStr}`;

        return {
            isVertical: false,
            m: mRounded,
            c: cRounded,
            raw,
            name: `Simpang Tegak Lurus (${raw})`
        };
    }

    /**
     * Parse simple linear equation string into standard form { A, B, C } where Ax + By = C
     */
    static parseLinearEquation(str) {
        if (!str || typeof str !== 'string') return null;
        let clean = str.replace(/\s+/g, '').toLowerCase();

        // Format x = k
        let matchX = clean.match(/^x=(-?\d+(\.\d+)?)$/);
        if (matchX) {
            const val = parseFloat(matchX[1]);
            return { A: 1, B: 0, C: val, isVertical: true, xVal: val, raw: str };
        }

        // Format y = mx + c
        let matchY = clean.match(/^y=((-?\d*(\.\d+)?)x)?([+-]\d+(\.\d+)?)?$/);
        if (matchY) {
            let mPart = matchY[1];
            let cPart = matchY[4];
            let m = 0;
            if (mPart !== undefined) {
                let mValStr = matchY[2];
                if (mValStr === "" || mValStr === "+") m = 1;
                else if (mValStr === "-") m = -1;
                else m = parseFloat(mValStr);
            }
            let c = 0;
            if (cPart !== undefined) {
                c = parseFloat(cPart);
            }
            return {
                A: m,
                B: -1,
                C: -c,
                m: m,
                c: c,
                isVertical: false,
                raw: str,
                toYString: () => {
                    if (m === 0) return `y = ${c}`;
                    let mStr = m === 1 ? 'x' : m === -1 ? '-x' : `${m}x`;
                    let cStr = c === 0 ? '' : c > 0 ? ` + ${c}` : ` - ${Math.abs(c)}`;
                    return `y = ${mStr}${cStr}`;
                }
            };
        }

        // Format Ax + By = C
        let matchStd = clean.match(/^([+-]?\d*(\.\d+)?)x([+-]\d*(\.\d+)?)y=(-?\d+(\.\d+)?)$/);
        if (matchStd) {
            let aStr = matchStd[1];
            let bStr = matchStd[3];
            let cStr = matchStd[5];

            let A = 1;
            if (aStr === "-") A = -1;
            else if (aStr && aStr !== "+") A = parseFloat(aStr);

            let B = 1;
            if (bStr === "-") B = -1;
            else if (bStr && bStr !== "+") B = parseFloat(bStr);

            let C = parseFloat(cStr);
            const isVert = B === 0;
            const m = isVert ? Infinity : -A / B;
            const c = isVert ? null : C / B;

            return { A, B, C, isVertical: isVert, m, c, raw: str };
        }

        return null;
    }

    /**
     * Solves SPLDV: Intersection of two lines
     */
    static solveSPLDV(line1, line2) {
        const A1 = line1.A, B1 = line1.B, C1 = line1.C;
        const A2 = line2.A, B2 = line2.B, C2 = line2.C;

        const det = A1 * B2 - A2 * B1;

        if (Math.abs(det) < 0.000001) {
            const detC = A1 * C2 - A2 * C1;
            if (Math.abs(detC) < 0.000001) {
                return {
                    hasIntersection: false,
                    isCoincident: true,
                    isParallel: false,
                    explanation: "Kedua garis berhimpit (memiliki tak hingga titik temu)."
                };
            }
            return {
                hasIntersection: false,
                isCoincident: false,
                isParallel: true,
                explanation: "Kedua garis sejajar (m1 = m2, tidak ada titik potong)."
            };
        }

        const x = (C1 * B2 - C2 * B1) / det;
        const y = (A1 * C2 - A2 * C1) / det;

        const xRounded = Math.round(x * 100) / 100;
        const yRounded = Math.round(y * 100) / 100;

        const steps = [
            `Sistem Persamaan Garis:`,
            `1) ${line1.raw || `${A1}x + ${B1}y = ${C1}`}`,
            `2) ${line2.raw || `${A2}x + ${B2}y = ${C2}`}`,
            `Determinan Utama (D) = (${A1})(${B2}) - (${A2})(${B1}) = ${Math.round(det * 100) / 100}`,
            `Dx = (${C1})(${B2}) - (${C2})(${B1}) = ${Math.round((C1 * B2 - C2 * B1) * 100) / 100}`,
            `Dy = (${A1})(${C2}) - (${A2})(${C1}) = ${Math.round((A1 * C2 - A2 * C1) * 100) / 100}`,
            `x = Dx / D = ${xRounded}`,
            `y = Dy / D = ${yRounded}`,
            `🎯 Titik Simpang Persimpangan = (${xRounded}, ${yRounded})`
        ];

        return {
            hasIntersection: true,
            isParallel: false,
            isCoincident: false,
            point: { x: xRounded, y: yRounded },
            steps: steps,
            explanation: steps.join("\n")
        };
    }

    /**
     * Parse Linear Inequality
     */
    static parseInequality(str) {
        if (!str || typeof str !== 'string') return null;
        let clean = str.replace(/\s+/g, '').toLowerCase();

        let opMatch = clean.match(/(<=|>=|<|>)/);
        if (!opMatch) return null;

        let op = opMatch[1];
        let parts = clean.split(op);
        let left = parts[0];
        let right = parts[1];

        // Format: y <= mx + c
        if (left === 'y') {
            let rightEq = MathEngine.parseLinearEquation(`y=${right}`);
            if (rightEq) {
                let A = -rightEq.m;
                let B = 1;
                let C = rightEq.c;
                return {
                    A, B, C, op, raw: str,
                    test: (x, y) => {
                        let val = A * x + B * y;
                        if (op === '<=') return val <= C + 0.0001;
                        if (op === '>=') return val >= C - 0.0001;
                        if (op === '<') return val < C - 0.0001;
                        if (op === '>') return val > C + 0.0001;
                        return false;
                    }
                };
            }
        }

        // Format: x [op] k
        if (left === 'x') {
            let k = parseFloat(right);
            if (!isNaN(k)) {
                return {
                    A: 1, B: 0, C: k, op, raw: str,
                    test: (x, y) => {
                        if (op === '<=') return x <= k + 0.0001;
                        if (op === '>=') return x >= k - 0.0001;
                        if (op === '<') return x < k - 0.0001;
                        if (op === '>') return x > k + 0.0001;
                        return false;
                    }
                };
            }
        }

        // Format: Ax + By [op] C
        let eqParsed = MathEngine.parseLinearEquation(`${left}=${right}`);
        if (eqParsed) {
            let { A, B, C } = eqParsed;
            return {
                A, B, C, op, raw: str,
                test: (x, y) => {
                    let val = A * x + B * y;
                    if (op === '<=') return val <= C + 0.0001;
                    if (op === '>=') return val >= C - 0.0001;
                    if (op === '<') return val < C - 0.0001;
                    if (op === '>') return val > C + 0.0001;
                    return false;
                }
            };
        }

        return null;
    }

    /**
     * Checks if a point (x, y) satisfies a list of inequalities
     */
    static isPointInSystem(point, inequalities) {
        if (!inequalities || inequalities.length === 0) return true;
        for (let ineq of inequalities) {
            if (!ineq.test(point.x, point.y)) {
                return false;
            }
        }
        return true;
    }

    /**
     * Generate step-by-step reasoning for testing inequality at point (x, y)
     */
    static explainInequalityTest(ineq, testPt = { x: 0, y: 0 }) {
        const val = ineq.A * testPt.x + ineq.B * testPt.y;
        const satisfies = ineq.test(testPt.x, testPt.y);
        const opSymbol = ineq.op;

        let leftStr = "";
        if (ineq.A !== 0) leftStr += `(${ineq.A})(${testPt.x})`;
        if (ineq.B !== 0) {
            if (leftStr.length > 0) leftStr += ineq.B > 0 ? " + " : " - ";
            leftStr += `(${Math.abs(ineq.B)})(${testPt.y})`;
        }

        return `Uji Titik Selidik (${testPt.x}, ${testPt.y}):\n` +
               `Substitusi ke ${ineq.raw}:\n` +
               `${leftStr} = ${val}\n` +
               `Apakah ${val} ${opSymbol} ${ineq.C}? ➔ ${satisfies ? 'BENAR (Daerah Penyelesaian memuat titik ini)' : 'SALAH (Arsiran berlawanan arah dengan titik ini)'}`;
    }

    /**
     * Presets / Ready-to-use Experiment Templates for Kids
     */
    static getSandboxTemplates() {
        return [
            {
                id: "metropolis_4q",
                name: "🌆 Metropolis 4 Kuadran",
                description: "Kota metropolitan dengan jalan arteri utama berbentuk salib (Sumbu X & Y) dan jalan diagonal lingkar luar.",
                lines: [
                    { id: "diag1", name: "Jalan Tol Diagonal: y = x", m: 1, c: 0, color: "#3B82F6", raw: "y = x", A: 1, B: -1, C: 0 },
                    { id: "diag2", name: "Jalan Lingkar Luar: y = -x + 4", m: -1, c: 4, color: "#EC4899", raw: "y = -x + 4", A: 1, B: 1, C: 4 }
                ],
                zones: [
                    { id: "z_cbd", name: "Pusat CBD", ineqs: ["x + y <= 5", "x >= 0", "y >= 0"], color: "rgba(139, 92, 246, 0.25)", label: "Zona Bisnis Utama" }
                ],
                items: [
                    { type: "school", name: "Sekolah 🏫", icon: "🏫", x: -3, y: 3, color: "#3B82F6" },
                    { type: "hospital", name: "RS Pusat 🏥", icon: "🏥", x: 3, y: -3, color: "#EF4444" },
                    { type: "building", name: "Mall Simpang 🏢", icon: "🏢", x: 2, y: 2, color: "#8B5CF6" },
                    { type: "park", name: "Taman Sentral 🌳", icon: "🌳", x: 0, y: 0, color: "#10B981" },
                    { type: "house", name: "Perumahan 🏠", icon: "🏠", x: 1, y: 1, color: "#F59E0B" }
                ]
            },
            {
                id: "river_delta",
                name: "🌊 Delta Sungai & Jembatan",
                description: "Sungai membelah wilayah kota, dilintasi jembatan penghubung yang tegak lurus.",
                lines: [
                    { id: "river", name: "Sungai Utama: y = -0.5x + 3", m: -0.5, c: 3, color: "#06B6D4", isRiver: true, raw: "y = -0.5x + 3", A: 0.5, B: 1, C: 3 },
                    { id: "bridge", name: "Jembatan Tegak Lurus: y = 2x - 2", m: 2, c: -2, color: "#F59E0B", raw: "y = 2x - 2", A: 2, B: -1, C: 2 }
                ],
                zones: [
                    { id: "z_green", name: "Bantaran Sungai Konservasi", ineqs: ["y <= -0.5x + 3", "y >= 0", "x >= 0"], color: "rgba(16, 185, 129, 0.25)", label: "Hutan Lindung RTH" }
                ],
                items: [
                    { type: "park", name: "Taman Tepi Air 🌳", icon: "🌳", x: 1, y: 1, color: "#10B981" },
                    { type: "park", name: "Taman Mangrove 🌳", icon: "🌳", x: 3, y: 0, color: "#10B981" },
                    { type: "house", name: "Pemukiman Hulu 🏠", icon: "🏠", x: -2, y: 5, color: "#F59E0B" },
                    { type: "building", name: "Dermaga Bisnis 🏢", icon: "🏢", x: 2, y: 2, color: "#8B5CF6" }
                ]
            },
            {
                id: "green_industrial",
                name: "🏭 Lembah Industri & Sabuk Hijau",
                description: "Tiga zona sejajar memisahkan area pabrik manufaktur, sabuk penyerap polusi, dan perumahan bersih.",
                lines: [
                    { id: "l_ind", name: "Batas Pabrik: y = x + 4", m: 1, c: 4, color: "#EF4444", raw: "y = x + 4", A: -1, B: 1, C: 4 },
                    { id: "l_res", name: "Batas Pemukiman: y = x - 2", m: 1, c: -2, color: "#10B981", raw: "y = x - 2", A: -1, B: 1, C: -2 }
                ],
                zones: [
                    { id: "z_factory", name: "Zona Industri Berat", ineqs: ["y >= x + 4", "x >= 0", "y >= 0"], color: "rgba(239, 68, 68, 0.25)", label: "Zona Pabrik" },
                    { id: "z_clean", name: "Zona Hunian Sehat", ineqs: ["y <= x - 2", "x >= 0", "y >= 0"], color: "rgba(245, 158, 11, 0.25)", label: "Perumahan Warga" }
                ],
                items: [
                    { type: "factory", name: "Pabrik Baja 🏭", icon: "🏭", x: 1, y: 6, color: "#64748B" },
                    { type: "factory", name: "Pabrik Tekstil 🏭", icon: "🏭", x: 2, y: 7, color: "#64748B" },
                    { type: "park", name: "Sabuk Hijau 🌳", icon: "🌳", x: 2, y: 2, color: "#10B981" },
                    { type: "park", name: "Hutan Kota 🌳", icon: "🌳", x: 3, y: 3, color: "#10B981" },
                    { type: "house", name: "Perumahan Asri 🏠", icon: "🏠", x: 5, y: 2, color: "#F59E0B" }
                ]
            },
            {
                id: "golden_triangle",
                name: "📐 Segitiga Emas DHP",
                description: "Tiga garis pertidaksamaan membatasi kawasan segitiga pusat perbelanjaan dan taman.",
                lines: [
                    { id: "t1", name: "Batas 1: y = 2x", m: 2, c: 0, color: "#3B82F6", raw: "y = 2x", A: 2, B: -1, C: 0 },
                    { id: "t2", name: "Batas 2: y = -x + 6", m: -1, c: 6, color: "#10B981", raw: "y = -x + 6", A: 1, B: 1, C: 6 },
                    { id: "t3", name: "Batas 3: y = 1", m: 0, c: 1, color: "#F59E0B", raw: "y = 1", A: 0, B: 1, C: 1 }
                ],
                zones: [
                    { id: "z_triangle", name: "Segitiga DHP Emas", ineqs: ["y <= 2x", "y <= -x + 6", "y >= 1"], color: "rgba(245, 158, 11, 0.3)", label: "Kawasan Segitiga Emas" }
                ],
                items: [
                    { type: "building", name: "Grand Plaza 🏢", icon: "🏢", x: 2, y: 3, color: "#8B5CF6" },
                    { type: "park", name: "Taman Segitiga 🌳", icon: "🌳", x: 2, y: 2, color: "#10B981" }
                ]
            }
        ];
    }
}

window.MathEngine = MathEngine;
