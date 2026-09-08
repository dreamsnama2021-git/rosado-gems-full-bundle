
insert into public.products (id, slug, name, description, price, compare_at_price, sku, stock, gemstone, cut, carat, clarity, metal, images, is_new, is_bestseller, is_trending, sort_order, meta_title, meta_description)
values
('11111111-1111-4111-8111-000000000001','demo-ruby-solitaire-ring','Demo — Ruby Solitaire Ring',
 '<p>A single Burmese-style ruby set in a softly twisted band. This demo product shows how <strong>variants</strong> work: pick a metal, a plating finish and your ring size — each combination carries its own SKU, price and stock.</p><p>Hand-finished, nickel-free and hallmarked. Ships in a signature Rosado box.</p>',
 24500, 29900, 'DEMO-RING', 25, 'Ruby', 'Round Brilliant', 1.25, 'VS1', '18K Gold',
 '["/__l5e/assets-v1/996d9c8a-6c46-48d0-a59c-168838b1b258/demo-ring.jpg"]'::jsonb,
 true, true, false, 1, 'Demo Ruby Solitaire Ring | Rosado Gems', 'A demo ruby solitaire ring showing metal, finish and ring-size variants with live pricing.'),
('11111111-1111-4111-8111-000000000002','demo-emerald-drop-pendant','Demo — Emerald Drop Pendant',
 '<p>A pear-cut emerald suspended from a fine cable chain. Use this demo to see how <strong>chain length</strong> and <strong>plating</strong> variants change the price and the photo shown on the page.</p><p>Each stone is hand-selected for colour saturation.</p>',
 18900, 22500, 'DEMO-PEND', 30, 'Emerald', 'Pear', 1.8, 'VVS2', '18K Gold',
 '["/__l5e/assets-v1/32b4eba7-5937-48a1-b3a1-da77da62e023/demo-pendant.jpg"]'::jsonb,
 true, false, true, 2, 'Demo Emerald Drop Pendant | Rosado Gems', 'A demo emerald pendant showing chain length and plating variants with per-variant pricing.'),
('11111111-1111-4111-8111-000000000003','demo-sapphire-tennis-bracelet','Demo — Sapphire Tennis Bracelet',
 '<p>Blue sapphires in a continuous white-gold line. This demo shows <strong>component</strong> and <strong>gemstone colour</strong> variants with colour swatches, plus bracelet length options.</p>',
 42500, 49900, 'DEMO-BRAC', 15, 'Blue Sapphire', 'Oval', 6.5, 'VS', '14K White Gold',
 '["/__l5e/assets-v1/f7006886-ce71-4583-af92-fcfa960ab17e/demo-bracelet.jpg"]'::jsonb,
 false, true, true, 3, 'Demo Sapphire Tennis Bracelet | Rosado Gems', 'A demo sapphire bracelet showing component, gemstone colour and length variants.');

insert into public.product_categories (product_id, category_id) values
('11111111-1111-4111-8111-000000000001','f62610a6-f2fe-4710-9c84-eb7200bae341'),
('11111111-1111-4111-8111-000000000001','57fa2a64-7215-4a41-a1e8-93b84020f1fb'),
('11111111-1111-4111-8111-000000000002','c6fb8e9c-678f-47d5-a9ca-f3b1ee9b99e0'),
('11111111-1111-4111-8111-000000000002','329b1cbc-d6d2-40bc-a1ef-4fb42b6cc011'),
('11111111-1111-4111-8111-000000000003','57fa2a64-7215-4a41-a1e8-93b84020f1fb');

update public.products set category_id='f62610a6-f2fe-4710-9c84-eb7200bae341' where id='11111111-1111-4111-8111-000000000001';
update public.products set category_id='c6fb8e9c-678f-47d5-a9ca-f3b1ee9b99e0' where id='11111111-1111-4111-8111-000000000002';
update public.products set category_id='57fa2a64-7215-4a41-a1e8-93b84020f1fb' where id='11111111-1111-4111-8111-000000000003';

-- Ring: Metal x Plating x Ring size
insert into public.product_variants (product_id, metal, plating, size, gemstone_color, color_hex, price, compare_at_price, sku, stock, image, sort_order)
select '11111111-1111-4111-8111-000000000001', m.metal, pl.plating, s.size, 'Ruby Red', '#9B111E',
       24500 + m.delta + pl.delta, 29900 + m.delta + pl.delta,
       'DEMO-RING-' || m.code || '-' || pl.code || '-' || s.size, 6,
       '/__l5e/assets-v1/996d9c8a-6c46-48d0-a59c-168838b1b258/demo-ring.jpg',
       row_number() over ()
from (values ('18K Gold','G',0),('Platinum','P',6000)) as m(metal, code, delta),
     (values ('Yellow Gold','YG',0),('Rose Gold','RG',1500)) as pl(plating, code, delta),
     (values ('12'),('14'),('16')) as s(size);

-- Pendant: Plating x Length
insert into public.product_variants (product_id, metal, plating, length, gemstone_color, color_hex, price, compare_at_price, sku, stock, image, sort_order)
select '11111111-1111-4111-8111-000000000002', '18K Gold', pl.plating, l.length, 'Emerald Green', '#046307',
       18900 + pl.delta + l.delta, 22500 + pl.delta + l.delta,
       'DEMO-PEND-' || pl.code || '-' || replace(l.length,'"',''), 8,
       '/__l5e/assets-v1/32b4eba7-5937-48a1-b3a1-da77da62e023/demo-pendant.jpg',
       row_number() over ()
from (values ('Yellow Gold','YG',0),('Rose Gold','RG',1200)) as pl(plating, code, delta),
     (values ('16 in',0),('18 in',900),('20 in',1800)) as l(length, delta);

-- Bracelet: Component x Gemstone colour x Length
insert into public.product_variants (product_id, component, metal, gemstone_color, color_hex, length, price, compare_at_price, sku, stock, image, sort_order)
select '11111111-1111-4111-8111-000000000003', c.component, '14K White Gold', g.gem, g.hex, c.length,
       42500 + c.delta + g.delta, 49900 + c.delta + g.delta,
       'DEMO-BRAC-' || c.code || '-' || g.code, 5,
       '/__l5e/assets-v1/f7006886-ce71-4583-af92-fcfa960ab17e/demo-bracelet.jpg',
       row_number() over ()
from (values ('Classic Line','CL','6.5 in',0),('Extended Line','EL','7.5 in',5500)) as c(component, code, length, delta),
     (values ('Blue Sapphire','BS','#0F52BA',0),('Pink Sapphire','PS','#E75480',2500),('White Topaz','WT','#F2F2F2',-4000)) as g(gem, code, hex, delta);
