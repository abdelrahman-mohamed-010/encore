-- =============================================================================
-- 0018_seed_events.sql
--
-- ~200 upcoming events across the next nine weeks, plus two dozen past ones so
-- profiles and organizer pages have history.
--
-- Only the facts that actually differ per event are listed: slug, title,
-- subtitle, topic, venue, when, and what kind of ticketing it uses. Everything
-- derivable — category, cover image, description, tags, timestamps — is joined
-- on from the lookups below, so the intent stays readable instead of drowning
-- in 200 near-identical INSERT rows.
--
-- Ids are UUIDv5 over the slug, so re-running matches existing rows instead of
-- inserting a second copy. Cover photo ids were each verified to return HTTP
-- 200 before being written here.
-- =============================================================================

set local statement_timeout = '600s';
-- The catalogue is staged in a table rather than a CTE because the two
-- migrations that follow read it back: ticket tiers need each event's kind,
-- and the demand generator needs it again. It is dropped in 0021.
create table if not exists public._seed_events_raw(
  slug text primary key, title text, topic text, org_slug text, venue_slug text,
  day_offset int, hh int, mi int, kind text, featured boolean, status text);

insert into public._seed_events_raw(slug, title, topic, org_slug, venue_slug,
  day_offset, hh, mi, kind, featured, status) values
 
('koshary-masterclass','Koshary Masterclass','food','koshary','v-kempinski',1,19,30,'paid',true,'published'),
 ('nile-jazz-quartet','Nile Jazz Quartet','music','sahelsessions','sahel-beach-arena',2,19,0,'paid',false,'published'),
 ('padel-open','Padel Open','sports','cairorunners','v-wadi',3,20,30,'free',false,'published'),
 ('silent-film-with-live-score','Silent Film with Live Score','film','townhouse','v-kodak',4,20,0,'free',false,'published'),
 ('stand-up-in-arabic','Stand-Up in Arabic','comedy','basement','v-tapas',5,21,30,'paid',false,'published'),
 ('open-source-saturday','Open Source Saturday','conference','maadimakers','v-tahrir',6,9,0,'paid',false,'published'),
 ('pilates-intensive','Pilates Intensive','wellness','zamalekyoga','v-kempinski',7,10,30,'free',false,'published'),
 ('watercolour-in-the-garden','Watercolour in the Garden','arts','alexbooks','',8,17,0,'online',false,'published'),
 ('kids-athletics-day','Kids'' Athletics Day','sports','cairo-live-nation','v-cairojazz',9,18,30,'paid',false,'published'),
 ('aida-opening-night-sep23','Aida — Opening Night','theatre','nile-arts-collective','v-garden',10,19,0,'soldout',false,'published'),
 ('coffee-cupping-single-origin','Coffee Cupping: Single Origin','food','koshary','v-garden',11,19,30,'paid',false,'published'),
 ('house-on-the-sand','House on the Sand','music','sahelsessions','v-almaza',12,20,0,'free',false,'published'),
 ('padel-open-2','Padel Open · Vol. 2','sports','cairorunners','v-gezira',13,20,30,'free',false,'published'),
 ('regional-premiere','Regional Premiere','film','townhouse','v-darb',14,21,0,'paid',false,'published'),
 ('comedy-gala','Comedy Gala','comedy','basement','v-kodak',15,9,30,'paid',false,'published'),
 ('frontend-cairo','Frontend Cairo','conference','maadimakers','cairo-opera-house-main-hall',16,10,0,'seated',false,'published'),
 ('breathwork-basics','Breathwork Basics','wellness','zamalekyoga','v-kempinski',17,17,30,'free',false,'published'),
 ('watercolour-in-the-garden-2','Watercolour in the Garden · Vol. 2','arts','alexbooks','v-bibliotheca',18,18,0,'paid',false,'published'),
 ('sunset-sessions','Sunset Sessions','music','cairo-live-nation','v-cairojazz',19,19,30,'paid',false,'published'),
 ('life-drawing-session','Life Drawing Session','arts','nile-arts-collective','v-kodak',20,19,0,'free',false,'published'),
 ('alexandria-seafood-night','Alexandria Seafood Night','food','koshary','v-kempinski',21,20,30,'paid',false,'published'),
 ('basement-techno','Basement Techno','music','sahelsessions','v-gouna',22,20,0,'paid',false,'published'),
 ('padel-open-3','Padel Open · Vol. 3','sports','cairorunners','v-zed',23,21,30,'free',false,'published'),
 ('restored-classic-cairo-station','Restored Classic: Cairo Station','film','townhouse','v-factory',24,9,0,'free',true,'published'),
 ('headliner-weekend','Headliner Weekend','comedy','basement','v-factory',25,10,30,'paid',false,'published'),
 ('freelancers-forum','Freelancers'' Forum','conference','maadimakers','v-bibliotheca',26,17,0,'paid',false,'published'),
 ('silent-nile-walk','Silent Nile Walk','wellness','zamalekyoga','v-kempinski',27,18,30,'free',false,'published'),
 ('watercolour-in-the-garden-3','Watercolour in the Garden · Vol. 3','arts','alexbooks','',28,19,0,'online',false,'published'),
 ('stand-up-in-arabic-2','Stand-Up in Arabic · Vol. 2','comedy','cairo-live-nation','v-cairojazz',29,19,30,'paid',false,'published'),
 ('regional-premiere-2','Regional Premiere · Vol. 2','film','nile-arts-collective','v-darb',30,20,0,'soldout',false,'published'),
 ('bakers-market-morning','Bakers'' Market Morning','food','koshary','v-garden',31,20,30,'paid',false,'published'),
 ('piano-recital-nocturnes','Piano Recital: Nocturnes','music','sahelsessions','sahel-beach-arena',32,21,0,'free',false,'published'),
 ('padel-open-4','Padel Open · Vol. 4','sports','cairorunners','v-wadi',33,9,30,'free',false,'published'),
 ('short-film-night','Short Film Night','film','townhouse','v-kodak',34,10,0,'paid',false,'published'),
 ('storytelling-night','Storytelling Night','comedy','basement','v-tapas',35,17,30,'paid',false,'published'),
 ('data-engineering-meetup','Data Engineering Meetup','conference','maadimakers','cairo-opera-house-main-hall',36,18,0,'seated',false,'published'),
 ('mobility-for-desk-workers','Mobility for Desk Workers','wellness','zamalekyoga','v-kempinski',37,19,30,'free',false,'published'),
 ('watercolour-in-the-garden-4','Watercolour in the Garden · Vol. 4','arts','alexbooks','v-kodak',38,19,0,'paid',false,'published'),
 ('kids-athletics-day-2','Kids'' Athletics Day · Vol. 2','sports','cairo-live-nation','v-cairojazz',39,20,30,'paid',false,'published'),
 ('aida-opening-night-2','Aida — Opening Night · Vol. 2','theatre','nile-arts-collective','v-garden',40,20,0,'free',false,'published'),
 ('nile-breakfast-club','Nile Breakfast Club','food','koshary','v-kempinski',41,21,30,'paid',false,'published'),
 ('cairo-symphony-autumn','Cairo Symphony: Autumn','music','sahelsessions','v-almaza',42,9,0,'paid',false,'published'),
 ('padel-open-5','Padel Open · Vol. 5','sports','cairorunners','v-gezira',43,10,30,'free',false,'published'),
 ('silent-film-with-live-score-2','Silent Film with Live Score · Vol. 2','film','townhouse','v-darb',44,17,0,'free',false,'published'),
 ('stand-up-in-arabic-3','Stand-Up in Arabic · Vol. 3','comedy','basement','v-kodak',45,18,30,'paid',false,'published'),
 ('accessibility-clinic','Accessibility Clinic','conference','maadimakers','the-greek-campus',46,19,0,'paid',false,'published'),
 ('pilates-intensive-2','Pilates Intensive · Vol. 2','wellness','zamalekyoga','v-kempinski',47,19,30,'free',true,'published'),
 ('watercolour-in-the-garden-5','Watercolour in the Garden · Vol. 5','arts','alexbooks','',48,20,0,'online',false,'published'),
 ('mahraganat-all-nighter','Mahraganat All-Nighter','music','cairo-live-nation','v-cairojazz',49,20,30,'paid',false,'published'),
 ('life-drawing-session-2','Life Drawing Session · Vol. 2','arts','nile-arts-collective','v-kodak',50,21,0,'soldout',false,'published'),
 ('cairo-cocktail-hour','Cairo Cocktail Hour','food','koshary','v-garden',51,9,30,'paid',false,'published'),
 ('sahel-closing-party','Sahel Closing Party','music','sahelsessions','v-gouna',52,10,0,'free',false,'published'),
 ('padel-open-6','Padel Open · Vol. 6','sports','cairorunners','v-zed',53,17,30,'free',false,'published'),
 ('regional-premiere-3','Regional Premiere · Vol. 3','film','townhouse','v-factory',54,18,0,'paid',false,'published'),
 ('comedy-gala-2','Comedy Gala · Vol. 2','comedy','basement','v-factory',55,19,30,'paid',false,'published'),
 ('women-in-tech-cairo','Women in Tech Cairo','conference','maadimakers','cairo-opera-house-main-hall',56,19,0,'seated',false,'published'),
 ('breathwork-basics-2','Breathwork Basics · Vol. 2','wellness','zamalekyoga','v-kempinski',57,20,30,'free',false,'published'),
 ('watercolour-in-the-garden-6','Watercolour in the Garden · Vol. 6','arts','alexbooks','v-stanley',58,20,0,'paid',false,'published'),
 ('storytelling-night-2','Storytelling Night · Vol. 2','comedy','cairo-live-nation','v-cairojazz',59,21,30,'paid',false,'published'),
 ('silent-film-with-live-score-3','Silent Film with Live Score · Vol. 3','film','nile-arts-collective','v-darb',60,9,0,'free',false,'published'),
 ('street-food-safari-downtown','Street Food Safari: Downtown','food','koshary','v-kempinski',61,10,30,'paid',false,'published'),
 ('desert-disco','Desert Disco','music','sahelsessions','sahel-beach-arena',62,17,0,'paid',false,'published'),
 ('padel-open-7','Padel Open · Vol. 7','sports','cairorunners','v-wadi',63,18,30,'free',false,'published'),
 ('restored-classic-cairo-station-2','Restored Classic: Cairo Station · Vol. 2','film','townhouse','v-kodak',1,19,0,'free',false,'published'),
 ('headliner-weekend-2','Headliner Weekend · Vol. 2','comedy','basement','v-tapas',2,19,30,'paid',false,'published'),
 ('product-design-day','Product Design Day','conference','maadimakers','v-tahrir',3,20,0,'paid',false,'published'),
 ('silent-nile-walk-2','Silent Nile Walk · Vol. 2','wellness','zamalekyoga','v-kempinski',4,20,30,'free',false,'published'),
 ('watercolour-in-the-garden-7','Watercolour in the Garden · Vol. 7','arts','alexbooks','',5,21,0,'online',false,'published'),
 ('kids-athletics-day-3','Kids'' Athletics Day · Vol. 3','sports','cairo-live-nation','v-cairojazz',6,9,30,'paid',false,'published'),
 ('aida-opening-night-3','Aida — Opening Night · Vol. 3','theatre','nile-arts-collective','v-garden',7,10,0,'soldout',true,'published'),
 ('dumpling-workshop','Dumpling Workshop','food','koshary','v-garden',8,17,30,'paid',false,'published'),
 ('roots-live','Roots Live','music','sahelsessions','v-almaza',9,18,0,'free',false,'published'),
 ('padel-open-8','Padel Open · Vol. 8','sports','cairorunners','v-gezira',10,19,30,'free',false,'published'),
 ('short-film-night-2','Short Film Night · Vol. 2','film','townhouse','v-darb',11,19,0,'paid',false,'published'),
 ('storytelling-night-3','Storytelling Night · Vol. 3','comedy','basement','v-kodak',12,20,30,'paid',false,'published'),
 ('fintech-regulation-panel','Fintech Regulation Panel','conference','maadimakers','cairo-opera-house-main-hall',13,20,0,'seated',false,'published'),
 ('mobility-for-desk-workers-2','Mobility for Desk Workers · Vol. 2','wellness','zamalekyoga','v-kempinski',14,21,30,'free',false,'published'),
 ('watercolour-in-the-garden-8','Watercolour in the Garden · Vol. 8','arts','alexbooks','v-bibliotheca',15,9,0,'paid',false,'published'),
 ('tarab-revival-night','Tarab Revival Night','music','cairo-live-nation','v-cairojazz',16,10,30,'paid',false,'published'),
 ('life-drawing-session-3','Life Drawing Session · Vol. 3','arts','nile-arts-collective','v-kodak',17,17,0,'free',false,'published'),
 ('ramadan-table-revisited','Ramadan Table Revisited','food','koshary','v-kempinski',18,18,30,'paid',false,'published'),
 ('vinyl-listening-party','Vinyl Listening Party','music','sahelsessions','v-gouna',19,19,0,'paid',false,'published'),
 ('padel-open-9','Padel Open · Vol. 9','sports','cairorunners','v-zed',20,19,30,'free',false,'published'),
 ('silent-film-with-live-score-4','Silent Film with Live Score · Vol. 4','film','townhouse','v-factory',21,20,0,'free',false,'published'),
 ('stand-up-in-arabic-4','Stand-Up in Arabic · Vol. 4','comedy','basement','v-factory',22,20,30,'paid',false,'published'),
 ('open-source-saturday-2','Open Source Saturday · Vol. 2','conference','maadimakers','v-bibliotheca',23,21,0,'paid',false,'published'),
 ('pilates-intensive-3','Pilates Intensive · Vol. 3','wellness','zamalekyoga','v-kempinski',24,9,30,'free',false,'published'),
 ('watercolour-in-the-garden-9','Watercolour in the Garden · Vol. 9','arts','alexbooks','',25,10,0,'online',false,'published'),
 ('headliner-weekend-3','Headliner Weekend · Vol. 3','comedy','cairo-live-nation','v-cairojazz',26,17,30,'paid',false,'published'),
 ('short-film-night-3','Short Film Night · Vol. 3','film','nile-arts-collective','v-darb',27,18,0,'soldout',false,'published'),
 ('koshary-masterclass-2','Koshary Masterclass · Vol. 2','food','koshary','v-garden',28,19,30,'paid',false,'published'),
 ('nile-jazz-quartet-2','Nile Jazz Quartet · Vol. 2','music','sahelsessions','sahel-beach-arena',29,19,0,'free',false,'published'),
 ('padel-open-10','Padel Open · Vol. 10','sports','cairorunners','v-wadi',30,20,30,'free',true,'published'),
 ('regional-premiere-4','Regional Premiere · Vol. 4','film','townhouse','v-kodak',31,20,0,'paid',false,'published'),
 ('comedy-gala-3','Comedy Gala · Vol. 3','comedy','basement','v-tapas',32,21,30,'paid',false,'published'),
 ('frontend-cairo-2','Frontend Cairo · Vol. 2','conference','maadimakers','cairo-opera-house-main-hall',33,9,0,'seated',false,'published'),
 ('breathwork-basics-3','Breathwork Basics · Vol. 3','wellness','zamalekyoga','v-kempinski',34,10,30,'free',false,'published'),
 ('watercolour-in-the-garden-10','Watercolour in the Garden · Vol. 10','arts','alexbooks','v-kodak',35,17,0,'paid',false,'published'),
 ('kids-athletics-day-4','Kids'' Athletics Day · Vol. 4','sports','cairo-live-nation','v-cairojazz',36,18,30,'paid',false,'published'),
 ('aida-opening-night-4','Aida — Opening Night · Vol. 4','theatre','nile-arts-collective','v-garden',37,19,0,'free',false,'published'),
 ('coffee-cupping-single-origin-2','Coffee Cupping: Single Origin · Vol. 2','food','koshary','v-kempinski',38,19,30,'paid',false,'published'),
 ('house-on-the-sand-2','House on the Sand · Vol. 2','music','sahelsessions','v-almaza',39,20,0,'paid',false,'published'),
 ('padel-open-11','Padel Open · Vol. 11','sports','cairorunners','v-gezira',40,20,30,'free',false,'published'),
 ('restored-classic-cairo-station-3','Restored Classic: Cairo Station · Vol. 3','film','townhouse','v-darb',41,21,0,'free',false,'published'),
 ('headliner-weekend-4','Headliner Weekend · Vol. 4','comedy','basement','v-kodak',42,9,30,'paid',false,'published'),
 ('freelancers-forum-2','Freelancers'' Forum · Vol. 2','conference','maadimakers','the-greek-campus',43,10,0,'paid',false,'published'),
 ('silent-nile-walk-3','Silent Nile Walk · Vol. 3','wellness','zamalekyoga','v-kempinski',44,17,30,'free',false,'published'),
 ('watercolour-in-the-garden-11','Watercolour in the Garden · Vol. 11','arts','alexbooks','',45,18,0,'online',false,'published'),
 ('sunset-sessions-2','Sunset Sessions · Vol. 2','music','cairo-live-nation','v-cairojazz',46,19,30,'paid',false,'published'),
 ('life-drawing-session-4','Life Drawing Session · Vol. 4','arts','nile-arts-collective','v-kodak',47,19,0,'soldout',false,'published'),
 ('alexandria-seafood-night-2','Alexandria Seafood Night · Vol. 2','food','koshary','v-garden',48,20,30,'paid',false,'published'),
 ('basement-techno-2','Basement Techno · Vol. 2','music','sahelsessions','v-gouna',49,20,0,'free',false,'published'),
 ('padel-open-12','Padel Open · Vol. 12','sports','cairorunners','v-zed',50,21,30,'free',false,'published'),
 ('short-film-night-4','Short Film Night · Vol. 4','film','townhouse','v-factory',51,9,0,'paid',false,'published'),
 ('storytelling-night-4','Storytelling Night · Vol. 4','comedy','basement','v-factory',52,10,30,'paid',false,'published'),
 ('data-engineering-meetup-2','Data Engineering Meetup · Vol. 2','conference','maadimakers','cairo-opera-house-main-hall',53,17,0,'seated',true,'published'),
 ('mobility-for-desk-workers-3','Mobility for Desk Workers · Vol. 3','wellness','zamalekyoga','v-kempinski',54,18,30,'free',false,'published'),
 ('watercolour-in-the-garden-12','Watercolour in the Garden · Vol. 12','arts','alexbooks','v-stanley',55,19,0,'paid',false,'published'),
 ('comedy-gala-4','Comedy Gala · Vol. 4','comedy','cairo-live-nation','v-cairojazz',56,19,30,'paid',false,'published'),
 ('restored-classic-cairo-station-4','Restored Classic: Cairo Station · Vol. 4','film','nile-arts-collective','v-darb',57,20,0,'free',false,'published'),
 ('bakers-market-morning-2','Bakers'' Market Morning · Vol. 2','food','koshary','v-kempinski',58,20,30,'paid',false,'published'),
 ('piano-recital-nocturnes-2','Piano Recital: Nocturnes · Vol. 2','music','sahelsessions','sahel-beach-arena',59,21,0,'paid',false,'published'),
 ('padel-open-13','Padel Open · Vol. 13','sports','cairorunners','v-wadi',60,9,30,'free',false,'published'),
 ('silent-film-with-live-score-5','Silent Film with Live Score · Vol. 5','film','townhouse','v-kodak',61,10,0,'free',false,'published'),
 ('stand-up-in-arabic-5','Stand-Up in Arabic · Vol. 5','comedy','basement','v-tapas',62,17,30,'paid',false,'published'),
 ('accessibility-clinic-2','Accessibility Clinic · Vol. 2','conference','maadimakers','v-tahrir',63,18,0,'paid',false,'published'),
 ('pilates-intensive-4','Pilates Intensive · Vol. 4','wellness','zamalekyoga','v-kempinski',1,19,30,'free',false,'published'),
 ('watercolour-in-the-garden-13','Watercolour in the Garden · Vol. 13','arts','alexbooks','',2,19,0,'online',false,'published'),
 ('kids-athletics-day-5','Kids'' Athletics Day · Vol. 5','sports','cairo-live-nation','v-cairojazz',3,20,30,'paid',false,'published'),
 ('aida-opening-night-5','Aida — Opening Night · Vol. 5','theatre','nile-arts-collective','v-garden',4,20,0,'soldout',false,'published'),
 ('nile-breakfast-club-2','Nile Breakfast Club · Vol. 2','food','koshary','v-garden',5,21,30,'paid',false,'published'),
 ('cairo-symphony-autumn-2','Cairo Symphony: Autumn · Vol. 2','music','sahelsessions','v-almaza',6,9,0,'free',false,'published'),
 ('padel-open-14','Padel Open · Vol. 14','sports','cairorunners','v-gezira',7,10,30,'free',false,'published'),
 ('regional-premiere-5','Regional Premiere · Vol. 5','film','townhouse','v-darb',8,17,0,'paid',false,'published'),
 ('comedy-gala-5','Comedy Gala · Vol. 5','comedy','basement','v-kodak',9,18,30,'paid',false,'published'),
 ('women-in-tech-cairo-2','Women in Tech Cairo · Vol. 2','conference','maadimakers','cairo-opera-house-main-hall',10,19,0,'seated',false,'published'),
 ('breathwork-basics-4','Breathwork Basics · Vol. 4','wellness','zamalekyoga','v-kempinski',11,19,30,'free',false,'published'),
 ('watercolour-in-the-garden-14','Watercolour in the Garden · Vol. 14','arts','alexbooks','v-bibliotheca',12,20,0,'paid',false,'published'),
 ('mahraganat-all-nighter-2','Mahraganat All-Nighter · Vol. 2','music','cairo-live-nation','v-cairojazz',13,20,30,'paid',true,'published'),
 ('life-drawing-session-5','Life Drawing Session · Vol. 5','arts','nile-arts-collective','v-kodak',14,21,0,'free',false,'published'),
 ('cairo-cocktail-hour-2','Cairo Cocktail Hour · Vol. 2','food','koshary','v-kempinski',15,9,30,'paid',false,'published'),
 ('sahel-closing-party-2','Sahel Closing Party · Vol. 2','music','sahelsessions','v-gouna',16,10,0,'paid',false,'published'),
 ('padel-open-15','Padel Open · Vol. 15','sports','cairorunners','v-zed',17,17,30,'free',false,'published'),
 ('restored-classic-cairo-station-5','Restored Classic: Cairo Station · Vol. 5','film','townhouse','v-factory',18,18,0,'free',false,'published'),
 ('headliner-weekend-5','Headliner Weekend · Vol. 5','comedy','basement','v-factory',19,19,30,'paid',false,'published'),
 ('product-design-day-2','Product Design Day · Vol. 2','conference','maadimakers','v-bibliotheca',20,19,0,'paid',false,'published'),
 ('silent-nile-walk-4','Silent Nile Walk · Vol. 4','wellness','zamalekyoga','v-kempinski',21,20,30,'free',false,'published'),
 ('watercolour-in-the-garden-15','Watercolour in the Garden · Vol. 15','arts','alexbooks','',22,20,0,'online',false,'published'),
 ('stand-up-in-arabic-6','Stand-Up in Arabic · Vol. 6','comedy','cairo-live-nation','v-cairojazz',23,21,30,'paid',false,'published'),
 ('regional-premiere-6','Regional Premiere · Vol. 6','film','nile-arts-collective','v-darb',24,9,0,'soldout',false,'published'),
 ('street-food-safari-downtown-2','Street Food Safari: Downtown · Vol. 2','food','koshary','v-garden',25,10,30,'paid',false,'published'),
 ('desert-disco-2','Desert Disco · Vol. 2','music','sahelsessions','sahel-beach-arena',26,17,0,'free',false,'published'),
 ('padel-open-16','Padel Open · Vol. 16','sports','cairorunners','v-wadi',27,18,30,'free',false,'published'),
 ('short-film-night-5','Short Film Night · Vol. 5','film','townhouse','v-kodak',28,19,0,'paid',false,'published'),
 ('storytelling-night-5','Storytelling Night · Vol. 5','comedy','basement','v-tapas',29,19,30,'paid',false,'published'),
 ('fintech-regulation-panel-2','Fintech Regulation Panel · Vol. 2','conference','maadimakers','cairo-opera-house-main-hall',30,20,0,'seated',false,'published'),
 ('mobility-for-desk-workers-4','Mobility for Desk Workers · Vol. 4','wellness','zamalekyoga','v-kempinski',31,20,30,'free',false,'published'),
 ('watercolour-in-the-garden-16','Watercolour in the Garden · Vol. 16','arts','alexbooks','v-kodak',32,21,0,'paid',false,'published'),
 ('kids-athletics-day-6','Kids'' Athletics Day · Vol. 6','sports','cairo-live-nation','v-cairojazz',33,9,30,'paid',false,'published'),
 ('aida-opening-night-6','Aida — Opening Night · Vol. 6','theatre','nile-arts-collective','v-garden',34,10,0,'free',false,'published'),
 ('dumpling-workshop-2','Dumpling Workshop · Vol. 2','food','koshary','v-kempinski',35,17,30,'paid',false,'published'),
 ('roots-live-2','Roots Live · Vol. 2','music','sahelsessions','v-almaza',36,18,0,'paid',true,'published'),
 ('padel-open-17','Padel Open · Vol. 17','sports','cairorunners','v-gezira',37,19,30,'free',false,'published'),
 ('silent-film-with-live-score-6','Silent Film with Live Score · Vol. 6','film','townhouse','v-darb',38,19,0,'free',false,'published'),
 ('stand-up-in-arabic-7','Stand-Up in Arabic · Vol. 7','comedy','basement','v-kodak',39,20,30,'paid',false,'published'),
 ('open-source-saturday-3','Open Source Saturday · Vol. 3','conference','maadimakers','the-greek-campus',40,20,0,'paid',false,'published'),
 ('pilates-intensive-5','Pilates Intensive · Vol. 5','wellness','zamalekyoga','v-kempinski',41,21,30,'free',false,'published'),
 ('watercolour-in-the-garden-17','Watercolour in the Garden · Vol. 17','arts','alexbooks','',42,9,0,'online',false,'published'),
 ('tarab-revival-night-2','Tarab Revival Night · Vol. 2','music','cairo-live-nation','v-cairojazz',43,10,30,'paid',false,'published'),
 ('life-drawing-session-6','Life Drawing Session · Vol. 6','arts','nile-arts-collective','v-kodak',44,17,0,'soldout',false,'published'),
 ('ramadan-table-revisited-2','Ramadan Table Revisited · Vol. 2','food','koshary','v-garden',45,18,30,'paid',false,'published'),
 ('vinyl-listening-party-2','Vinyl Listening Party · Vol. 2','music','sahelsessions','v-gouna',46,19,0,'free',false,'published'),
 ('padel-open-18','Padel Open · Vol. 18','sports','cairorunners','v-zed',47,19,30,'free',false,'published'),
 ('regional-premiere-7','Regional Premiere · Vol. 7','film','townhouse','v-factory',48,20,0,'paid',false,'published'),
 ('comedy-gala-6','Comedy Gala · Vol. 6','comedy','basement','v-factory',49,20,30,'paid',false,'published'),
 ('frontend-cairo-3','Frontend Cairo · Vol. 3','conference','maadimakers','cairo-opera-house-main-hall',50,21,0,'seated',false,'published'),
 ('breathwork-basics-5','Breathwork Basics · Vol. 5','wellness','zamalekyoga','v-kempinski',51,9,30,'free',false,'published'),
 ('watercolour-in-the-garden-18','Watercolour in the Garden · Vol. 18','arts','alexbooks','v-stanley',52,10,0,'paid',false,'published'),
 ('storytelling-night-6','Storytelling Night · Vol. 6','comedy','cairo-live-nation','v-cairojazz',53,17,30,'paid',false,'published'),
 ('silent-film-with-live-score-7','Silent Film with Live Score · Vol. 7','film','nile-arts-collective','v-darb',54,18,0,'free',false,'published'),
 ('koshary-masterclass-3','Koshary Masterclass · Vol. 3','food','koshary','v-kempinski',55,19,30,'paid',false,'published'),
 ('nile-jazz-quartet-3','Nile Jazz Quartet · Vol. 3','music','sahelsessions','sahel-beach-arena',56,19,0,'paid',false,'published'),
 ('padel-open-19','Padel Open · Vol. 19','sports','cairorunners','v-wadi',57,20,30,'free',false,'published'),
 ('restored-classic-cairo-station-6','Restored Classic: Cairo Station · Vol. 6','film','townhouse','v-kodak',58,20,0,'free',false,'published'),
 ('headliner-weekend-6','Headliner Weekend · Vol. 6','comedy','basement','v-tapas',59,21,30,'paid',true,'published'),
 ('freelancers-forum-3','Freelancers'' Forum · Vol. 3','conference','maadimakers','v-tahrir',60,9,0,'paid',false,'published'),
 ('silent-nile-walk-5','Silent Nile Walk · Vol. 5','wellness','zamalekyoga','v-kempinski',61,10,30,'free',false,'published'),
 ('watercolour-in-the-garden-19','Watercolour in the Garden · Vol. 19','arts','alexbooks','',62,17,0,'online',false,'published'),
 ('kids-athletics-day-7','Kids'' Athletics Day · Vol. 7','sports','cairo-live-nation','v-cairojazz',63,18,30,'paid',false,'published'),
 ('aida-opening-night-7','Aida — Opening Night · Vol. 7','theatre','nile-arts-collective','v-garden',1,19,0,'soldout',false,'published'),
 ('coffee-cupping-single-origin-3','Coffee Cupping: Single Origin · Vol. 3','food','koshary','v-garden',2,19,30,'paid',false,'published'),
 ('house-on-the-sand-3','House on the Sand · Vol. 3','music','sahelsessions','v-almaza',3,20,0,'free',false,'published'),
 ('padel-open-20','Padel Open · Vol. 20','sports','cairorunners','v-gezira',4,20,30,'free',false,'published'),
 ('short-film-night-6','Short Film Night · Vol. 6','film','townhouse','v-darb',5,21,0,'paid',false,'published'),
 ('storytelling-night-7','Storytelling Night · Vol. 7','comedy','basement','v-kodak',6,9,30,'paid',false,'published'),
 ('data-engineering-meetup-3','Data Engineering Meetup · Vol. 3','conference','maadimakers','cairo-opera-house-main-hall',7,10,0,'seated',false,'published'),
 ('mobility-for-desk-workers-5','Mobility for Desk Workers · Vol. 5','wellness','zamalekyoga','v-kempinski',8,17,30,'free',false,'published'),
 ('watercolour-in-the-garden-20','Watercolour in the Garden · Vol. 20','arts','alexbooks','v-bibliotheca',9,18,0,'paid',false,'published'),
 ('sunset-sessions-3','Sunset Sessions · Vol. 3','music','cairo-live-nation','v-cairojazz',10,19,30,'paid',false,'published'),
 ('life-drawing-session-7','Life Drawing Session · Vol. 7','arts','nile-arts-collective','v-kodak',11,19,0,'free',false,'published'),
 ('alexandria-seafood-night-3','Alexandria Seafood Night · Vol. 3','food','koshary','v-kempinski',-4,20,30,'paid',false,'completed'),
 ('basement-techno-3','Basement Techno · Vol. 3','music','sahelsessions','v-gouna',-9,20,0,'paid',false,'completed'),
 ('padel-open-21','Padel Open · Vol. 21','sports','cairorunners','v-zed',-14,21,30,'free',false,'completed'),
 ('silent-film-with-live-score-8','Silent Film with Live Score · Vol. 8','film','townhouse','v-factory',-19,9,0,'paid',false,'completed'),
 ('stand-up-in-arabic-8','Stand-Up in Arabic · Vol. 8','comedy','basement','v-factory',-24,10,30,'paid',false,'completed'),
 ('accessibility-clinic-3','Accessibility Clinic · Vol. 3','conference','maadimakers','v-bibliotheca',-29,17,0,'paid',false,'completed'),
 ('pilates-intensive-6','Pilates Intensive · Vol. 6','wellness','zamalekyoga','v-kempinski',-34,18,30,'free',false,'completed'),
 ('watercolour-in-the-garden-21','Watercolour in the Garden · Vol. 21','arts','alexbooks','v-stanley',-39,19,0,'paid',false,'completed'),
 ('kids-athletics-day-8','Kids'' Athletics Day · Vol. 8','sports','cairo-live-nation','v-cairojazz',-44,19,30,'paid',false,'completed'),
 ('aida-opening-night-8','Aida — Opening Night · Vol. 8','theatre','nile-arts-collective','v-darb',-49,20,0,'free',false,'completed'),
 ('bakers-market-morning-3','Bakers'' Market Morning · Vol. 3','food','koshary','v-garden',-54,20,30,'paid',false,'completed'),
 ('piano-recital-nocturnes-3','Piano Recital: Nocturnes · Vol. 3','music','sahelsessions','sahel-beach-arena',-59,21,0,'paid',false,'completed'),
 ('padel-open-22','Padel Open · Vol. 22','sports','cairorunners','v-wadi',-64,9,30,'free',false,'completed'),
 ('regional-premiere-8','Regional Premiere · Vol. 8','film','townhouse','v-kodak',-69,10,0,'paid',false,'completed'),
 ('comedy-gala-7','Comedy Gala · Vol. 7','comedy','basement','v-tapas',-74,17,30,'paid',false,'completed'),
 ('women-in-tech-cairo-3','Women in Tech Cairo · Vol. 3','conference','maadimakers','v-tahrir',-79,18,0,'paid',false,'completed'),
 ('breathwork-basics-6','Breathwork Basics · Vol. 6','wellness','zamalekyoga','v-kempinski',-84,19,30,'free',false,'completed'),
 ('watercolour-in-the-garden-22','Watercolour in the Garden · Vol. 22','arts','alexbooks','v-kodak',-89,19,0,'paid',false,'completed'),
 ('oud-strings-evening','Oud & Strings Evening','music','cairo-live-nation','v-cairojazz',-94,20,30,'paid',false,'completed'),
 ('life-drawing-session-8','Life Drawing Session · Vol. 8','arts','nile-arts-collective','v-garden',-99,20,0,'free',false,'completed'),
 ('nile-breakfast-club-3','Nile Breakfast Club · Vol. 3','food','koshary','v-kempinski',-104,21,30,'paid',false,'completed'),
 ('cairo-symphony-autumn-3','Cairo Symphony: Autumn · Vol. 3','music','sahelsessions','v-almaza',-109,9,0,'paid',false,'completed'),
 ('padel-open-23','Padel Open · Vol. 23','sports','cairorunners','v-gezira',-114,10,30,'free',false,'completed'),
 ('restored-classic-cairo-station-7','Restored Classic: Cairo Station · Vol. 7','film','townhouse','v-darb',-119,17,0,'paid',false,'completed')
on conflict (slug) do nothing;

with
-- topic -> the category it files under
topic_category(topic, category_slug) as (values
  ('music','music'),('food','food'),('conference','conference'),('theatre','theatre'),
  ('arts','arts'),('sports','sports'),('comedy','comedy'),('film','film'),
  ('wellness','sports'),('community','arts')
),
-- topic -> cover photos, picked round-robin by position so neighbouring cards
-- in a grid never repeat an image
topic_photos(topic, photos) as (values
  ('music',   array['photo-1493225457124-a3eb161ffa5f','photo-1514320291840-2e0a9bf2a9ae','photo-1501386761578-eac5c94b800a','photo-1459749411175-04bf5292ceea','photo-1506157786151-b8491531f063','photo-1429962714451-bb934ecdc4ec','photo-1524368535928-5b5e00ddc76b','photo-1514525253161-7a46d19cd819','photo-1533174072545-7a4b6ad7a6c3','photo-1483393458019-411bc6bd104e','photo-1470225620780-dba8ba36b745','photo-1415886541506-6efc5e4b1786']),
  ('food',    array['photo-1414235077428-338989a2e8c0','photo-1517248135467-4c7edcad34c4','photo-1552566626-52f8b828add9','photo-1555396273-367ea4eb4db5','photo-1466978913421-dad2ebd01d17','photo-1504674900247-0877df9cc836','photo-1559339352-11d035aa65de','photo-1424847651672-bf20a4b0982b','photo-1550966871-3ed3cdb5ed0c','photo-1481931098730-318b6f776db0','photo-1528605248644-14dd04022da1','photo-1514933651103-005eec06c04b','photo-1517093602195-b40af9688b46','photo-1600891964092-4316c288032e']),
  ('conference',array['photo-1540575467063-178a50c2df87','photo-1505373877841-8d25f7d46678','photo-1475721027785-f74eccf877e2','photo-1511578314322-379afb476865','photo-1591115765373-5207764f72e7','photo-1531482615713-2afd69097998','photo-1522071820081-009f0129c71c','photo-1517245386807-bb43f82c33c4','photo-1552664730-d307ca884978','photo-1556761175-b413da4baf72','photo-1523580846011-d3a5bc25702b','photo-1560439514-4e9645039924']),
  ('theatre', array['photo-1503095396549-807759245b35','photo-1507924538820-ede94a04019d','photo-1514306191717-452ec28c7814','photo-1460723237483-7a6dc9d0b212','photo-1495562569060-2eec283d3391','photo-1516450360452-9312f5e86fc7']),
  ('arts',    array['photo-1531243269054-5ebf6f34081e','photo-1513364776144-60967b0f800f','photo-1536924940846-227afb31e2a5','photo-1517697471339-4aa32003c11a','photo-1580136579312-94651dfd596d','photo-1547891654-e66ed7ebb968']),
  ('sports',  array['photo-1461896836934-ffe607ba8211','photo-1552674605-db6ffd4facb5','photo-1571019613454-1cb2f99b2d8b','photo-1517649763962-0c623066013b','photo-1534438327276-14e5300c3a48','photo-1546519638-68e109498ffc']),
  ('comedy',  array['photo-1585699324551-f6c309eedeca','photo-1527224857830-43a7acc85260','photo-1543007630-9710e4a00a20','photo-1499364615650-ec38552f4f34','photo-1470019693664-1d202d2c0907']),
  ('film',    array['photo-1489599849927-2ee91cede3ba','photo-1517604931442-7e0c8ed2963c','photo-1440404653325-ab127d49abc1','photo-1478720568477-152d9b164e26','photo-1594908900066-3f47337549d8','photo-1536440136628-849c177e76a1']),
  ('wellness',array['photo-1544367567-0f2fcb009e0b','photo-1506126613408-eca07ce68773','photo-1518611012118-696072aa579a','photo-1476480862126-209bfaa8edc8','photo-1571019614242-c5c5dee9f50b','photo-1588286840104-8957b019727f']),
  ('community',array['photo-1511632765486-a01980e01a18','photo-1523580494863-6f3031224c94','photo-1492684223066-81342ee5ff30','photo-1530103862676-de8c9debad1d','photo-1556157382-97eda2d62296','photo-1543269865-cbf427effbad','photo-1517457373958-b7bdd4587205','photo-1559223607-a43c990c692c','photo-1524178232363-1fb2b075b655'])
),
topic_copy(topic, description, tags, hours) as (values
  ('food','A seat at a long table with people you have not met yet.

The menu leans on what the market had that morning, so it shifts week to week. Tell us about allergies when you book and the kitchen will work around them.', array['food','supperclub'], 3),
  ('music','Doors open an hour before the first set, and the room fills quickly.

The bar runs all night and the sound system was rebuilt last spring. Tickets are per person and non-transferable on the door.', array['live','music'], 3),
  ('conference','A working session rather than a lecture — expect to open a laptop.

Seats are limited so the room stays small enough for questions. Coffee, notes and the slide deck are included.', array['tech','workshop'], 4),
  ('theatre','A new production staged for a short run.

Latecomers are seated at a suitable break in the performance. The auditorium opens thirty minutes before curtain.', array['theatre','stage'], 3),
  ('arts','A small group, real instruction and every material you need.

No experience is assumed. Whatever you make is yours to take home, and the studio stays open for an hour afterwards.', array['art','workshop'], 3),
  ('sports','Every pace is welcome and nobody gets left behind.

Route marshals stay with the back of the group. Water is provided at the halfway point and there is somewhere to leave a bag.', array['running','fitness'], 2),
  ('comedy','Six acts, one host and a room that is closer to the stage than you expect.

Material is unpolished by design — this is where jokes get tried before they tour. Over-18s only.', array['comedy','standup'], 3),
  ('film','Introduced by the programmer, with time for questions afterwards.

The print has been restored and the room is dark and quiet by the time the titles run. Doors thirty minutes before.', array['film','screening'], 3),
  ('wellness','Mats, blocks and straps are provided — bring yourself and something warm.

The session is paced for every level, with alternatives offered throughout. It finishes with tea on the terrace.', array['yoga','wellness'], 1),
  ('community','Free, open and genuinely for everyone, including people arriving alone.

There is always someone on the door to introduce you. Tea is on, and the evening winds down around ten.', array['books','community'], 3)
),
topic_subtitles(topic, subs) as (values
  ('food',array['One long table, seven courses.','Bring an appetite and a friend.','Cooked over fire, eaten outside.','Small plates, big night.','A menu that changes every week.']),
  ('music',array['Doors at eight, first set at nine.','Full band, one night only.','Loud room, good speakers.','Support act announced next week.','Standing only.']),
  ('conference',array['Talks, then questions, then coffee.','Bring a laptop.','Four sessions, one afternoon.','Practical, not theoretical.','Beginner friendly.']),
  ('theatre',array['Ninety minutes, no interval.','Arabic with English surtitles.','Limited run.','A new production.','Contains haze and strobe.']),
  ('arts',array['Materials included.','No experience needed.','Small group, real instruction.','Bring something to work on.','Studio stays open after.']),
  ('sports',array['All paces welcome.','Meet fifteen minutes early.','Free, but please register.','Kit provided.','Finishes with breakfast.']),
  ('comedy',array['Six acts, one host.','New material, be kind.','Late show, sharp tongues.','Over-18s only.','Two drinks minimum.']),
  ('film',array['Introduced by the programmer.','35mm print.','Q&A after the screening.','Subtitled.','Doors thirty minutes before.']),
  ('wellness',array['Mats provided.','Come as you are.','Forty-five minutes.','All levels.','Ends with tea.']),
  ('community',array['Free and open to everyone.','Bring a book to swap.','Tea and biscuits provided.','Newcomers especially welcome.','Runs monthly.'])
),
prepared as (
  select
    r.*,
    (date '2026-09-13' + r.day_offset) + make_time(r.hh, r.mi, 0) at time zone 'Africa/Cairo' as starts_at,
    tc.description, tc.tags, tc.hours,
    ts.subs,
    tcat.category_slug,
    tp.photos,
    row_number() over (partition by r.topic order by r.slug) as seq
  from public._seed_events_raw r
  join topic_copy tc     on tc.topic = r.topic
  join topic_category tcat on tcat.topic = r.topic
  join topic_photos tp   on tp.topic = r.topic
  join topic_subtitles ts on ts.topic = r.topic
)
insert into public.events (
  id, organizer_id, category_id, venue_id, title, slug, subtitle, description,
  cover_image_url, status, visibility, seating_type, starts_at, ends_at,
  doors_open_at, timezone, is_online, online_url, min_age, tags,
  refund_policy, terms, is_featured, view_count
)
select
  md5('tazkarti:event:' || p.slug)::uuid,
  o.id,
  c.id,
  v.id,
  p.title,
  p.slug,
  p.subs[1 + (p.seq % array_length(p.subs, 1))],
  p.description,
  'https://images.unsplash.com/' || p.photos[1 + (p.seq % array_length(p.photos, 1))]
    || '?auto=format&fit=crop&w=1200&q=70',
  p.status::event_status,
  'public'::event_visibility,
  (case when p.kind = 'seated' then 'reserved_seating' else 'general_admission' end)::seating_type,
  p.starts_at,
  p.starts_at + make_interval(hours => p.hours),
  case when p.kind <> 'online' then p.starts_at - interval '45 minutes' end,
  'Africa/Cairo',
  p.kind = 'online',
  case when p.kind = 'online' then 'https://meet.tazkarti.app/' || p.slug end,
  case when p.topic = 'comedy' then 18 end,
  p.tags,
  'Full refunds up to 7 days before the event.',
  'One ticket admits one person. Please bring ID.',
  p.featured,
  40 + (('x' || substr(md5(p.slug), 1, 6))::bit(24)::int % 900)
from prepared p
join public.organizers o      on o.slug = p.org_slug
left join public.categories c on c.slug = p.category_slug
left join public.venues v     on v.slug = nullif(p.venue_slug, '')
-- A slug is globally unique, so skip any an earlier seed already took.
where not exists (select 1 from public.events e where e.slug = p.slug)
on conflict (id) do nothing;
