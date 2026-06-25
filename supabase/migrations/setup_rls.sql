-- Enable Row Level Security on the collect_data table
ALTER TABLE public.collect_data ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow management and gudang all access" ON public.collect_data;
DROP POLICY IF EXISTS "Allow admin cabang matching cabang" ON public.collect_data;
DROP POLICY IF EXISTS "Allow CS matching cabang" ON public.collect_data;

-- 1. Staf Gudang & Staf Keuangan Manajemen: Access and modify all records across all branches
CREATE POLICY "Allow management and gudang all access" ON public.collect_data
    FOR ALL
    TO authenticated
    USING (
        (auth.jwt() -> 'user_metadata' ->> 'role') IN ('Staf Gudang', 'Gudang', 'Staf Keuangan  Manajemen', 'Staf Keuangan', 'Keuangan', 'Manajemen')
    )
    WITH CHECK (
        (auth.jwt() -> 'user_metadata' ->> 'role') IN ('Staf Gudang', 'Gudang', 'Staf Keuangan  Manajemen', 'Staf Keuangan', 'Keuangan', 'Manajemen')
    );

-- 2. Admin Cabang: Access and modify records ONLY if the cabang matches their own cabang
CREATE POLICY "Allow admin cabang matching cabang" ON public.collect_data
    FOR ALL
    TO authenticated
    USING (
        (auth.jwt() -> 'user_metadata' ->> 'role') IN ('Admin Cabang', 'Admin')
        AND cabang = (auth.jwt() -> 'user_metadata' ->> 'cabang')
    )
    WITH CHECK (
        (auth.jwt() -> 'user_metadata' ->> 'role') IN ('Admin Cabang', 'Admin')
        AND cabang = (auth.jwt() -> 'user_metadata' ->> 'cabang')
    );

-- 3. Layanan Konsumen / CS: Access and modify records ONLY if the cabang matches their own cabang
CREATE POLICY "Allow CS matching cabang" ON public.collect_data
    FOR ALL
    TO authenticated
    USING (
        (auth.jwt() -> 'user_metadata' ->> 'role') IN ('Layanan Konsumen', 'Layanan Konsumen / CS', 'CS')
        AND cabang = (auth.jwt() -> 'user_metadata' ->> 'cabang')
    )
    WITH CHECK (
        (auth.jwt() -> 'user_metadata' ->> 'role') IN ('Layanan Konsumen', 'Layanan Konsumen / CS', 'CS')
        AND cabang = (auth.jwt() -> 'user_metadata' ->> 'cabang')
    );
