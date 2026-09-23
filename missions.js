/**
 * Mission Definitions for City Planner — Misi Menata Kota
 * 6 progressive levels covering coordinates, linear equations, SPLDV, inequalities, and basic linear programming.
 */
const CITY_MISSIONS = [
    {
        id: 1,
        title: "Misi 1: Fondasi Kota — Peletakan Fasilitas Vital",
        badge: "Pemula (Koordinat & Jarak)",
        icon: "🧭",
        summary: "Kenalkan struktur tata ruang kota dengan menempatkan fasilitas vital pada titik koordinat yang tepat.",
        mathTopic: "Bidang Koordinat Kartesius & Kuadran",
        gridRange: { minX: -6, maxX: 6, minY: -6, maxY: 6 },
        theoryGuide: "Bidang Kartesius terdiri dari Sumbu X (horizontal) dan Sumbu Y (vertikal). Titik (x, y) menyatakan langkah horizontal sejauh x dan langkah vertikal sejauh y.",
        starterItems: [
            { type: "school", name: "Sekolah 🏫", icon: "🏫", count: 1, color: "#3B82F6" },
            { type: "hospital", name: "Rumah Sakit 🏥", icon: "🏥", count: 1, color: "#EF4444" },
            { type: "park", name: "Taman Pusat 🌳", icon: "🌳", count: 1, color: "#10B981" },
            { type: "house", name: "Perumahan 🏠", icon: "🏠", count: 3, color: "#F59E0B" }
        ],
        fixedDecorations: [],
        lines: [],
        zones: [],
        rules: [
            { id: "r1", text: "Bangun 🏫 Sekolah tepat di titik koordinat (3, 4) (Kuadran I)." },
            { id: "r2", text: "Bangun 🏥 Rumah Sakit di titik koordinat (-4, 2) (Kuadran II)." },
            { id: "r3", text: "Bangun 🌳 Taman Pusat tepat di titik asal (0, 0)." },
            { id: "r4", text: "Bangun 3 unit 🏠 Perumahan di Kuadran I (x > 0, y > 0) dengan jarak minimal 2 satuan dari pusat (0,0)." }
        ],
        validate: (placedItems) => {
            const errors = [];
            const steps = [];

            const school = placedItems.find(i => i.type === "school");
            if (!school || school.x !== 3 || school.y !== 4) {
                errors.push("🏫 Sekolah belum ditempatkan tepat di koordinat (3, 4).");
            } else {
                steps.push("✅ Sekolah tepat berada di (3, 4).");
            }

            const hospital = placedItems.find(i => i.type === "hospital");
            if (!hospital || hospital.x !== -4 || hospital.y !== 2) {
                errors.push("🏥 Rumah Sakit belum ditempatkan tepat di koordinat (-4, 2).");
            } else {
                steps.push("✅ Rumah Sakit tepat berada di (-4, 2).");
            }

            const park = placedItems.find(i => i.type === "park");
            if (!park || park.x !== 0 || park.y !== 0) {
                errors.push("🌳 Taman Pusat belum ditempatkan di titik asal (0, 0).");
            } else {
                steps.push("✅ Taman Pusat tepat di (0, 0).");
            }

            const houses = placedItems.filter(i => i.type === "house");
            if (houses.length < 3) {
                errors.push(`🏠 Baru ${houses.length}/3 Perumahan yang ditempatkan.`);
            } else {
                let validHouses = 0;
                houses.forEach((h, idx) => {
                    const dist = Math.sqrt(h.x * h.x + h.y * h.y);
                    if (h.x > 0 && h.y > 0 && dist >= 2) {
                        validHouses++;
                        steps.push(`✅ Rumah ${idx + 1} di (${h.x}, ${h.y}) ➔ Kuadran I, Jarak = ${dist.toFixed(2)} ≥ 2.`);
                    } else {
                        errors.push(`❌ Rumah di (${h.x}, ${h.y}) tidak memenuhi syarat (harus di Kuadran I x>0, y>0 dan jarak ≥ 2).`);
                    }
                });
                if (validHouses < 3) {
                    errors.push("Belum semua 3 rumah memenuhi syarat posisi.");
                }
            }

            return {
                isComplete: errors.length === 0,
                errors,
                steps,
                score: errors.length === 0 ? 100 : Math.max(0, 100 - errors.length * 25)
            };
        }
    },
    {
        id: 2,
        title: "Misi 2: Jalur Arteri — Persamaan Garis Lurus",
        badge: "Menengah (y = mx + c)",
        icon: "🛣️",
        summary: "Hubungkan Distrik Barat (-3, -1) dan Distrik Timur (3, 5) dengan Jalan Raya Utama melalui rumus garis lurus.",
        mathTopic: "Gradien (Kemiringan Garis) & Persamaan Garis y = mx + c",
        gridRange: { minX: -5, maxX: 5, minY: -5, maxY: 5 },
        theoryGuide: "Gradien m = (y2 - y1) / (x2 - x1). Persamaan garis: y - y1 = m(x - x1) atau y = mx + c.",
        starterItems: [
            { type: "building", name: "Pusat Layanan 🏢", icon: "🏢", count: 1, color: "#8B5CF6" },
            { type: "house", name: "Rumah Tepi Jalan 🏠", icon: "🏠", count: 2, color: "#F59E0B" }
        ],
        fixedDecorations: [
            { type: "pin", x: -3, y: -1, label: "Distrik Barat (-3, -1)", color: "#3B82F6" },
            { type: "pin", x: 3, y: 5, label: "Distrik Timur (3, 5)", color: "#10B981" }
        ],
        targetEquation: "y = x + 2",
        requireLineInput: true,
        rules: [
            { id: "r1", text: "Hitung gradien m dan buat Jalan Raya 🛣️ yang menghubungkan (-3, -1) dan (3, 5)." },
            { id: "r2", text: "Persamaan garis yang benar adalah: y = x + 2 (m = 1, c = 2)." },
            { id: "r3", text: "Bangun 🏢 Pusat Layanan tepat pada titik potong sumbu-Y di garis tersebut (0, 2)." },
            { id: "r4", text: "Bangun 2 unit 🏠 Rumah yang berada tepat di sepanjang jalur garis jalan (misal: (1, 3) atau (-1, 1) atau (-2, 0))." }
        ],
        validate: (placedItems, activeLines) => {
            const errors = [];
            const steps = [];

            // Check line
            const hasRoad = activeLines && activeLines.some(l => {
                // Line must pass through (-3, -1) and (3, 5) => y = x + 2 => m=1, c=2
                return Math.abs(l.m - 1) < 0.05 && Math.abs(l.c - 2) < 0.05;
            });

            if (!hasRoad) {
                errors.push("🛣️ Jalan Raya Utama y = x + 2 belum dibangun atau persamaannya belum sesuai.");
            } else {
                steps.push("✅ Jalan Utama y = x + 2 berhasil terhubung dengan gradien m = 1.");
            }

            const building = placedItems.find(i => i.type === "building");
            if (!building || building.x !== 0 || building.y !== 2) {
                errors.push("🏢 Pusat Layanan belum berada di titik potong sumbu-Y (0, 2).");
            } else {
                steps.push("✅ Pusat Layanan tepat di titik potong sumbu-Y (0, 2).");
            }

            const houses = placedItems.filter(i => i.type === "house");
            if (houses.length < 2) {
                errors.push(`🏠 Baru ${houses.length}/2 Rumah tepi jalan yang ditempatkan.`);
            } else {
                let onRoadHouses = 0;
                houses.forEach((h, idx) => {
                    // Check if y = x + 2
                    if (h.y === h.x + 2 && (h.x !== 0 || h.y !== 2)) { // not sharing with building
                        onRoadHouses++;
                        steps.push(`✅ Rumah ${idx + 1} di (${h.x}, ${h.y}) berada tepat di jalur jalan y = x + 2.`);
                    } else {
                        errors.push(`❌ Rumah di (${h.x}, ${h.y}) tidak berada tepat di jalur jalan y = x + 2.`);
                    }
                });
                if (onRoadHouses < 2) {
                    errors.push("Rumah harus berada pada titik koordinat yang memenuhi y = x + 2.");
                }
            }

            return {
                isComplete: errors.length === 0,
                errors,
                steps,
                score: errors.length === 0 ? 100 : Math.max(0, 100 - errors.length * 25)
            };
        }
    },
    {
        id: 3,
        title: "Misi 3: Simpang Emas — Sistem Persamaan Linear Dua Variabel",
        badge: "Menengah (SPLDV & Titik Potong)",
        icon: "🏢",
        summary: "Dua jalan arteri kota berpotongan. Temukan titik simpul persimpangan untuk mendirikan Pusat Bisnis Metropolitan.",
        mathTopic: "Sistem Persamaan Linear Dua Variabel (SPLDV)",
        gridRange: { minX: -2, maxX: 8, minY: -2, maxY: 10 },
        theoryGuide: "Titik potong dua garis adalah solusi dari SPLDV. Selesaikan dengan metode substitusi: 2x - 1 = -x + 8 ➔ 3x = 9 ➔ x = 3, y = 5.",
        starterItems: [
            { type: "building", name: "Mall / Central Hub 🏢", icon: "🏢", count: 1, color: "#8B5CF6" },
            { type: "hospital", name: "RS Siaga 🏥", icon: "🏥", count: 1, color: "#EF4444" }
        ],
        fixedDecorations: [],
        lines: [
            { id: "l1", name: "Jalan Melati: y = 2x - 1", m: 2, c: -1, color: "#3B82F6", raw: "y = 2x - 1", A: 2, B: -1, C: 1 },
            { id: "l2", name: "Jalan Sudirman: x + y = 8", m: -1, c: 8, color: "#10B981", raw: "x + y = 8", A: 1, B: 1, C: 8 }
        ],
        zones: [],
        rules: [
            { id: "r1", text: "Dua jalan raya telah tersedia: Jalan Melati (y = 2x - 1) dan Jalan Sudirman (x + y = 8)." },
            { id: "r2", text: "Hitung titik potong persimpangan kedua jalan (SPLDV)." },
            { id: "r3", text: "Bangun 🏢 Mall / Central Hub tepat pada titik potong persimpangan (3, 5)." },
            { id: "r4", text: "Bangun 🏥 RS Siaga di titik (1, 7) (terletak pada Jalan Sudirman untuk akses gawat darurat)." }
        ],
        validate: (placedItems) => {
            const errors = [];
            const steps = [];

            const mall = placedItems.find(i => i.type === "building");
            if (!mall || mall.x !== 3 || mall.y !== 5) {
                errors.push("🏢 Mall / Central Hub belum dibangun tepat di titik potong (3, 5).");
            } else {
                steps.push("✅ Mall tepat berada di titik potong (3, 5). Substitusi: 2(3) - 1 = 5 dan 3 + 5 = 8 (BENAR).");
            }

            const hospital = placedItems.find(i => i.type === "hospital");
            if (!hospital || hospital.x !== 1 || hospital.y !== 7) {
                errors.push("🏥 RS Siaga belum dibangun di titik akses (1, 7).");
            } else {
                steps.push("✅ RS Siaga di (1, 7) memenuhi persamaan x + y = 8 (1 + 7 = 8).");
            }

            return {
                isComplete: errors.length === 0,
                errors,
                steps,
                score: errors.length === 0 ? 100 : Math.max(0, 100 - errors.length * 50)
            };
        }
    },
    {
        id: 4,
        title: "Misi 4: Paru-Paru Kota — Pertidaksamaan Linear & Konservasi",
        badge: "Mahir (Pertidaksamaan Linear)",
        icon: "🌳",
        summary: "Bantaran sungai rawan banjir! Tentukan Daerah Himpunan Penyelesaian (DHP) zona hijau dan tempatkan taman konservasi.",
        mathTopic: "Pertidaksamaan Linear Dua Variabel (ax + by ≤ c)",
        gridRange: { minX: -1, maxX: 11, minY: -1, maxY: 7 },
        theoryGuide: "Garis batas sungai adalah x + 2y = 10. Uji titik (0,0): 0 + 2(0) = 0 ≤ 10 (Benar). Maka daerah DHP berada di bawah/kiri garis sungai.",
        starterItems: [
            { type: "park", name: "Taman Konservasi 🌳", icon: "🌳", count: 4, color: "#10B981" },
            { type: "house", name: "Rumah Warga 🏠", icon: "🏠", count: 2, color: "#F59E0B" }
        ],
        fixedDecorations: [],
        lines: [
            { id: "river", name: "Batas Sungai: x + 2y = 10", m: -0.5, c: 5, color: "#06B6D4", isRiver: true, width: 4, raw: "x + 2y = 10", A: 1, B: 2, C: 10 }
        ],
        zones: [
            { id: "z1", name: "Zona Hijau Konservasi", ineqs: ["x + 2y <= 10", "x >= 0", "y >= 0"], color: "rgba(16, 185, 129, 0.25)", label: "DHP Zona Konservasi" }
        ],
        rules: [
            { id: "r1", text: "Zona Konservasi Hijau dibatasi oleh: x + 2y ≤ 10, x ≥ 0, y ≥ 0." },
            { id: "r2", text: "Tempatkan 4 unit 🌳 Taman Konservasi di dalam Daerah Himpunan Penyelesaian (DHP)." },
            { id: "r3", text: "Tempatkan 2 unit 🏠 Rumah di dalam DHP aman (x + 2y ≤ 10, x ≥ 0, y ≥ 0)." },
            { id: "r4", text: "Dilarang menempatkan bangunan di luar DHP (daerah rawan banjir x + 2y > 10)." }
        ],
        validate: (placedItems) => {
            const errors = [];
            const steps = [];

            const parks = placedItems.filter(i => i.type === "park");
            const houses = placedItems.filter(i => i.type === "house");

            if (parks.length < 4) {
                errors.push(`🌳 Baru ${parks.length}/4 Taman Konservasi yang ditempatkan.`);
            }
            if (houses.length < 2) {
                errors.push(`🏠 Baru ${houses.length}/2 Rumah yang ditempatkan.`);
            }

            let illegalItems = 0;
            placedItems.forEach((item) => {
                const inDHP = (item.x + 2 * item.y <= 10) && (item.x >= 0) && (item.y >= 0);
                if (!inDHP) {
                    illegalItems++;
                    errors.push(`❌ ${item.name || item.type} di (${item.x}, ${item.y}) melanggar batas (x + 2y = ${item.x + 2 * item.y} > 10 atau di luar kuadran I).`);
                } else {
                    steps.push(`✅ ${item.name || item.type} di (${item.x}, ${item.y}) ➔ ${item.x} + 2(${item.y}) = ${item.x + 2 * item.y} ≤ 10 (Aman).`);
                }
            });

            return {
                isComplete: errors.length === 0 && parks.length >= 4 && houses.length >= 2,
                errors,
                steps,
                score: errors.length === 0 ? 100 : Math.max(0, 100 - errors.length * 20)
            };
        }
    },
    {
        id: 5,
        title: "Misi 5: Sabuk Penyangga Polusi — Sistem Pertidaksamaan Linear",
        badge: "Mahir (Sistem Pertidaksamaan)",
        icon: "🏭",
        summary: "Pisahkan Zona Industri Pabrik dari Zona Pemukiman Warga menggunakan pembatas pertidaksamaan linear dan sabuk hijau.",
        mathTopic: "Sistem Pertidaksamaan Linear Dua Variabel",
        gridRange: { minX: -1, maxX: 10, minY: -1, maxY: 10 },
        theoryGuide: "Zona Industri (y ≥ x + 3) dipisahkan oleh Sabuk Hijau (x - 1 < y < x + 3) dari Zona Pemukiman (y ≤ x - 1 dan x + y ≤ 10).",
        starterItems: [
            { type: "factory", name: "Pabrik Industri 🏭", icon: "🏭", count: 2, color: "#EF4444" },
            { type: "house", name: "Perumahan Bersih 🏠", icon: "🏠", count: 3, color: "#F59E0B" },
            { type: "park", name: "Sabuk Hijau 🌳", icon: "🌳", count: 3, color: "#10B981" }
        ],
        fixedDecorations: [],
        lines: [
            { id: "factory_border", name: "Batas Polusi: y = x + 3", m: 1, c: 3, color: "#EF4444", raw: "y = x + 3", A: -1, B: 1, C: 3 },
            { id: "residence_border", name: "Batas Pemukiman: y = x - 1", m: 1, c: -1, color: "#F59E0B", raw: "y = x - 1", A: -1, B: 1, C: -1 }
        ],
        zones: [
            { id: "ind_zone", name: "Zona Industri (y ≥ x + 3)", ineqs: ["y >= x + 3", "x >= 0", "y >= 0"], color: "rgba(239, 68, 68, 0.2)" },
            { id: "res_zone", name: "Zona Bersih (y ≤ x - 1, x + y ≤ 10)", ineqs: ["y <= x - 1", "x + y <= 10", "x >= 0", "y >= 0"], color: "rgba(245, 158, 11, 0.2)" }
        ],
        rules: [
            { id: "r1", text: "Tempatkan 2 🏭 Pabrik di Zona Industri: y ≥ x + 3, x ≥ 0, y ≥ 0." },
            { id: "r2", text: "Tempatkan 3 🏠 Rumah di Zona Bersih: y ≤ x - 1 dan x + y ≤ 10, x ≥ 0, y ≥ 0." },
            { id: "r3", text: "Tempatkan 3 🌳 Taman di Sabuk Penyangga antara dua garis: x - 1 < y < x + 3." }
        ],
        validate: (placedItems) => {
            const errors = [];
            const steps = [];

            const factories = placedItems.filter(i => i.type === "factory");
            const houses = placedItems.filter(i => i.type === "house");
            const parks = placedItems.filter(i => i.type === "park");

            if (factories.length < 2) errors.push(`🏭 Baru ${factories.length}/2 Pabrik ditempatkan.`);
            if (houses.length < 3) errors.push(`🏠 Baru ${houses.length}/3 Rumah ditempatkan.`);
            if (parks.length < 3) errors.push(`🌳 Baru ${parks.length}/3 Taman ditempatkan.`);

            factories.forEach((f, idx) => {
                if (f.y >= f.x + 3 && f.x >= 0 && f.y >= 0) {
                    steps.push(`✅ Pabrik ${idx + 1} di (${f.x}, ${f.y}) ➔ ${f.y} ≥ ${f.x} + 3 (Benar di Zona Industri).`);
                } else {
                    errors.push(`❌ Pabrik di (${f.x}, ${f.y}) tidak memenuhi y ≥ x + 3.`);
                }
            });

            houses.forEach((h, idx) => {
                const inZone = (h.y <= h.x - 1) && (h.x + h.y <= 10) && (h.x >= 0) && (h.y >= 0);
                if (inZone) {
                    steps.push(`✅ Rumah ${idx + 1} di (${h.x}, ${h.y}) ➔ Memenuhi y ≤ x - 1 dan x + y ≤ 10 (Zona Bersih).`);
                } else {
                    errors.push(`❌ Rumah di (${h.x}, ${h.y}) tidak memenuhi syarat Zona Bersih.`);
                }
            });

            parks.forEach((p, idx) => {
                const inBuffer = (p.y > p.x - 1) && (p.y < p.x + 3) && (p.x >= 0) && (p.y >= 0);
                if (inBuffer) {
                    steps.push(`✅ Taman Sabuk Hijau ${idx + 1} di (${p.x}, ${p.y}) ➔ Berada di antara kedua zona (Penyerap Polusi).`);
                } else {
                    errors.push(`❌ Taman di (${p.x}, ${p.y}) tidak berada di area sabuk penyangga (x - 1 < y < x + 3).`);
                }
            });

            return {
                isComplete: errors.length === 0 && factories.length >= 2 && houses.length >= 3 && parks.length >= 3,
                errors,
                steps,
                score: errors.length === 0 ? 100 : Math.max(0, 100 - errors.length * 20)
            };
        }
    },
    {
        id: 6,
        title: "Misi 6: Master Urban Zoning — Optimasi Nilai Kota",
        badge: "Pakar (Program Linear & Titik Optimum)",
        icon: "🏆",
        summary: "Kapasitas lahan dan utilitas terbatas. Gunakan titik pojok DHP untuk memaksimalkan Nilai Indeks Kota Z = 50x + 80y.",
        mathTopic: "Program Linear: Fungsi Objektif & Titik Pojok DHP",
        gridRange: { minX: -1, maxX: 10, minY: -1, maxY: 9 },
        theoryGuide: "Kendala: (1) x + y ≤ 6, (2) 2x + y ≤ 8, x ≥ 0, y ≥ 0. Titik-titik pojok DHP: (0,0)=0, (4,0)=200, (2,4)=420, (0,6)=480. Nilai maksimum adalah di (0, 6) = 480 atau jika membutuhkan kedua fasilitas (2, 4) = 420.",
        starterItems: [
            { type: "house", name: "Rumah (x) 🏠", icon: "🏠", count: 6, color: "#F59E0B" },
            { type: "building", name: "Ruko Komersial (y) 🏢", icon: "🏢", count: 6, color: "#8B5CF6" }
        ],
        fixedDecorations: [],
        lines: [
            { id: "c1", name: "Kendala Lahan: x + y = 6", m: -1, c: 6, color: "#3B82F6", raw: "x + y = 6", A: 1, B: 1, C: 6 },
            { id: "c2", name: "Kendala Utilitas: 2x + y = 8", m: -2, c: 8, color: "#EC4899", raw: "2x + y = 8", A: 2, B: 1, C: 8 }
        ],
        zones: [
            { id: "opt_dhp", name: "DHP Program Linear", ineqs: ["x + y <= 6", "2x + y <= 8", "x >= 0", "y >= 0"], color: "rgba(59, 130, 246, 0.2)" }
        ],
        rules: [
            { id: "r1", text: "Kombinasi pembangunan dibatasi oleh: x + y ≤ 6, 2x + y ≤ 8, x ≥ 0, y ≥ 0." },
            { id: "r2", text: "Fungsi Nilai Indeks Kota: Z = 50x + 80y (x = jumlah unit rumah, y = jumlah unit komersial)." },
            { id: "r3", text: "Cari titik pojok optimum yang memuat kedua fasilitas (x > 0 dan y > 0). Titik potong (2, 4) menghasilkan Z = 50(2) + 80(4) = 420." },
            { id: "r4", text: "Tentukan dan bangun tepat 2 🏠 Rumah dan 4 🏢 Ruko Komersial di dalam DHP." }
        ],
        validate: (placedItems) => {
            const errors = [];
            const steps = [];

            const houses = placedItems.filter(i => i.type === "house");
            const buildings = placedItems.filter(i => i.type === "building");

            const x = houses.length;
            const y = buildings.length;

            steps.push(`📊 Jumlah Bangunan: x = ${x} Rumah, y = ${y} Ruko Komersial.`);

            // Check constraints
            const c1 = x + y <= 6;
            const c2 = 2 * x + y <= 8;

            if (!c1) errors.push(`❌ Melanggar Kendala Lahan: ${x} + ${y} = ${x + y} > 6.`);
            else steps.push(`✅ Memenuhi Kendala Lahan: ${x} + ${y} = ${x + y} ≤ 6.`);

            if (!c2) errors.push(`❌ Melanggar Kendala Utilitas: 2(${x}) + ${y} = ${2 * x + y} > 8.`);
            else steps.push(`✅ Memenuhi Kendala Utilitas: 2(${x}) + ${y} = ${2 * x + y} ≤ 8.`);

            // Check if all placed items are within DHP
            placedItems.forEach((item) => {
                if (item.x < 0 || item.y < 0 || item.x + item.y > 6 || 2 * item.x + item.y > 8) {
                    errors.push(`❌ Bangunan di posisi (${item.x}, ${item.y}) berada di luar area DHP.`);
                }
            });

            const Z = 50 * x + 80 * y;
            steps.push(`🎯 Skor Nilai Kota Z = 50(${x}) + 80(${y}) = ${Z} poin.`);

            if (x === 2 && y === 4 && errors.length === 0) {
                steps.push(`🌟 LUAR BIASA! Anda mencapai titik optimum seimbang (2, 4) dengan Skor Z = 420.`);
            } else if (errors.length === 0 && x > 0 && y > 0) {
                if (Z < 420) {
                    errors.push(`Nilai Z saat ini = ${Z}. Nilai optimal seimbang adalah Z = 420 di titik (x=2, y=4).`);
                }
            } else if (x === 0 || y === 0) {
                errors.push("Kota membutuhkan diversifikasi: bangun minimal 1 Rumah dan 1 Ruko Komersial.");
            }

            return {
                isComplete: errors.length === 0 && x === 2 && y === 4,
                errors,
                steps,
                score: errors.length === 0 ? 100 : Math.max(0, Math.round((Z / 420) * 80))
            };
        }
    }
];

window.CITY_MISSIONS = CITY_MISSIONS;
