# Credits

## Tools and libraries

FastAPI, Uvicorn, Pydantic, ChromaDB, sentence-transformers (`paraphrase-multilingual-MiniLM-L12-v2`), google-genai (Gemini), Sarvam AI (translation), python-dotenv, pytest, React, Vite, Tailwind CSS, Lenis, and the browser's Web Speech API. Optional local fallback: Ollama. Claude (Anthropic) was used as an AI coding assistant during the hackathon window.

## Data

All place, event, weather, advisory, hotel and guide data comes from the PS-13 dataset provided by KogniVera for the KogniVera Hackathon 2026 (`data-model/seed/PS-13.db`).

## Visual assets

The city hero images in `frontend/public/cities/` are downloaded from Wikimedia Commons and used under their listed Creative Commons licenses:

- Bengaluru (`bengaluru.jpg`): [Bangalore skyline (7121517855).jpg](https://commons.wikimedia.org/wiki/File:Bangalore_skyline_%287121517855%29.jpg), CC BY 2.0, Saad Faruque.
- Mumbai (`mumbai.jpg`): [Mumbai skyline category](https://commons.wikimedia.org/wiki/Category:Skylines_of_Mumbai), Wikimedia Commons source.
- Hyderabad (`hyderabad.jpg`): [Charminar Evening View Hyderabad.jpg](https://commons.wikimedia.org/wiki/File:Charminar_Evening_View_Hyderabad.jpg), free-use Wikimedia Commons upload.
- Pune (`pune.jpg`): [Pune Skyline.jpg](https://commons.wikimedia.org/wiki/File:Pune_Skyline.jpg), CC BY-SA 3.0, Tushar Mote.

Day and night variants for the day/night toggle, also from Wikimedia Commons (resized to 1920 px):

- Bengaluru by day (`bengaluru-day.jpg`): [Vidhana Soudha, front (01).jpg](https://commons.wikimedia.org/wiki/File:Vidhana_Soudha,_front_(01).jpg), CC BY-SA 4.0, Moheen Reeyad.
- Mumbai by night (`mumbai-night.jpg`): [Mumbai Skyline Marine Drive Night.jpg](https://commons.wikimedia.org/wiki/File:Mumbai_Skyline_Marine_Drive_Night.jpg), CC BY-SA 4.0, Av9.
- Hyderabad by night (`hyderabad-night.jpg`): [Charminar Hyderabad night view.jpg](https://commons.wikimedia.org/wiki/File:Charminar_Hyderabad_night_view.jpg), CC BY-SA 4.0, Rashid Jorvee.
- Pune by night (`pune-night.jpg`): [Sinhagad Road Pune at Night.jpg](https://commons.wikimedia.org/wiki/File:Sinhagad_Road_Pune_at_Night.jpg), public domain, Amityadav8.

The Bengaluru skyline above is the night view; the Mumbai, Hyderabad and Pune images above are the day views. `default.jpg` is a local fallback copy of the Bengaluru image.

The place-card photos in `frontend/public/places/` (one per place category, shown on the Arrive page's nearby-places deck; the dataset's places have no photos of their own) are also from Wikimedia Commons, resized to 900 px:

- Wellness (`wellness.jpg`): [Yogi in meditation, Banyan tree in meditation, Paliem, Goa, India.jpg](https://commons.wikimedia.org/wiki/File:Yogi_in_meditation,_Banyan_tree_in_meditation,_Paliem,_Goa,_India.jpg), CC BY 4.0, Vyacheslav Argenberg.
- Beach (`beach.jpg`): [Vagator Beach, Goa, India, Palms.jpg](https://commons.wikimedia.org/wiki/File:Vagator_Beach,_Goa,_India,_Palms.jpg), CC BY 4.0, Vyacheslav Argenberg.
- Nature (`nature.jpg`): [Western ghats waterfall.jpg](https://commons.wikimedia.org/wiki/File:Western_ghats_waterfall.jpg), CC BY-SA 4.0, Samson Joseph.
- Adventure (`adventure.jpg`): [Paragliding at Bir, HP.jpg](https://commons.wikimedia.org/wiki/File:Paragliding_at_Bir,_HP.jpg), CC BY-SA 4.0, PanWoyteczek (derivative work).
- Food (`food.jpg`): [South Indian Thali Cropped.jpg](https://commons.wikimedia.org/wiki/File:South_Indian_Thali_Cropped.jpg), CC BY 2.0, Tracy Hunter.
- Nightlife (`nightlife.jpg`): [Brigade Road, Bangalore at night (2024) 01.jpg](https://commons.wikimedia.org/wiki/File:Brigade_Road,_Bangalore_at_night_(2024)_01.jpg), CC BY-SA 4.0, Gpkp.
- Shopping (`shopping.jpg`): [Shopkeeper - Indian Market.jpg](https://commons.wikimedia.org/wiki/File:Shopkeeper_-_Indian_Market.jpg), CC BY 4.0, RioRiyoRio.
- Wildlife (`wildlife.jpg`): [Elephas maximus (Bandipur).jpg](https://commons.wikimedia.org/wiki/File:Elephas_maximus_(Bandipur).jpg), CC BY-SA 3.0, Yathin S Krishnappa.
- Viewpoint (`viewpoint.jpg`): [Sunrise at Nandi Hills.jpg](https://commons.wikimedia.org/wiki/File:Sunrise_at_Nandi_Hills.jpg), CC BY-SA 4.0, JzG.
- Museum (`museum.jpg`): [Indian Museum, Gallery, Kolkata, India.jpg](https://commons.wikimedia.org/wiki/File:Indian_Museum,_Gallery,_Kolkata,_India.jpg), CC BY 4.0, Vyacheslav Argenberg.
- Religious (`religious.jpg`): [Hindu Temple in Hunsur.jpg](https://commons.wikimedia.org/wiki/File:Hindu_Temple_in_Hunsur.jpg), CC BY-SA 4.0, Prof tpms.
- Heritage (`heritage.jpg`): [Hampi Vitthala Temple 3465.jpg](https://commons.wikimedia.org/wiki/File:Hampi_Vitthala_Temple_3465.jpg), CC BY-SA 4.0, Basavaraj M.

Place-type photos in `frontend/public/places/names/` match the type in each place's name ("Butterfly Reserve", "Stepwell"); a place with no matching type uses its category photo above. All from Wikimedia Commons, resized to 900 px:

- `antique-lane.jpg`: [Antique items for sale at a roadside shop in Ballygunge, Kolkata.jpg](https://commons.wikimedia.org/wiki/File:Antique_items_for_sale_at_a_roadside_shop_in_Ballygunge,_Kolkata.jpg), CC BY-SA 4.0, Billjones94.
- `ayurveda-centre.jpg`: [Sadananda vaidyasala2.jpg](https://commons.wikimedia.org/wiki/File:Sadananda_vaidyasala2.jpg), CC BY-SA 4.0, Fotokannan.
- `backwater-channel.jpg`: [Kerala Backwaters - Canal near Chamabakulam.jpg](https://commons.wikimedia.org/wiki/File:Kerala_Backwaters_-_Canal_near_Chamabakulam.jpg), CC BY-SA 4.0, Ingo Mehling.
- `bazaar.jpg`: [Hampi Bazaar, India.jpg](https://commons.wikimedia.org/wiki/File:Hampi_Bazaar,_India.jpg), CC BY 4.0, Vyacheslav Argenberg.
- `bird-sanctuary.jpg`: [Eurasian Spoonbill Walking Ranganathittu Karnataka Jan24 A7C 09151.jpg](https://commons.wikimedia.org/wiki/File:Eurasian_Spoonbill_Walking_Ranganathittu_Karnataka_Jan24_A7C_09151.jpg), CC BY-SA 4.0, This Photo was taken by Timothy A. Gonsalves.  Feel free to.
- `blue-pottery-workshop.jpg`: [Blue Pottery Jaipur Collection.jpg](https://commons.wikimedia.org/wiki/File:Blue_Pottery_Jaipur_Collection.jpg), CC BY-SA 4.0, Neek-Theri.
- `botanical-gardens.jpg`: [Indian Independence day celebration 216th flower show 2024, Lalbagh, Bangalore 129.jpg](https://commons.wikimedia.org/wiki/File:Indian_Independence_day_celebration_216th_flower_show_2024,_Lalbagh,_Bangalore_129.jpg), CC BY-SA 4.0, Gpkp.
- `butterfly-reserve.jpg`: [Peacock butterfly (Aglais io) 2.jpg](https://commons.wikimedia.org/wiki/File:Peacock_butterfly_(Aglais_io)_2.jpg), CC BY-SA 3.0, Charles J. Sharp.
- `chhatri-complex.jpg`: [Jaisalmer-Vyas Chhatri Cenotaphs-20131010.jpg](https://commons.wikimedia.org/wiki/File:Jaisalmer-Vyas_Chhatri_Cenotaphs-20131010.jpg), CC BY-SA 3.0, Daniel VILLAFRUELA.
- `city-museum.jpg`: [Thekke Kottaram Heritage Museum Mar24 A7C 10164.jpg](https://commons.wikimedia.org/wiki/File:Thekke_Kottaram_Heritage_Museum_Mar24_A7C_10164.jpg), CC BY-SA 4.0, This Photo was taken by Timothy A. Gonsalves.  Feel free to.
- `city-walls-walk.jpg`: [Hyderabad City Wall Afzal Darwaza.jpg](https://commons.wikimedia.org/wiki/File:Hyderabad_City_Wall_Afzal_Darwaza.jpg), public domain, Claude Campbell.
- `cliff-walk.jpg`: [Varkala Cliff by KS.jpg](https://commons.wikimedia.org/wiki/File:Varkala_Cliff_by_KS.jpg), CC BY-SA 4.0, Krissubh.
- `coffee-roastery-tour.jpg`: [Dülmen, Privatrösterei Schröer -- 2018 -- 2.jpg](https://commons.wikimedia.org/wiki/File:D%C3%BClmen,_Privatr%C3%B6sterei_Schr%C3%B6er_--_2018_--_2.jpg), CC BY-SA 4.0, Dietmar Rabich.
- `cooking-class.jpg`: [Kenya-cooking-class-1024x683-1.webp](https://commons.wikimedia.org/wiki/File:Kenya-cooking-class-1024x683-1.webp), CC BY-SA 4.0, K a r a044.
- `crocodile-park.jpg`: [Mugger crocodile (Crocodylus palustris) Gal Oya.jpg](https://commons.wikimedia.org/wiki/File:Mugger_crocodile_(Crocodylus_palustris)_Gal_Oya.jpg), CC BY-SA 4.0, Charles J. Sharp.
- `cycling-loop.jpg`: [Tour la Nuit Montreal 2019 approaching Olympic Stadium.jpg](https://commons.wikimedia.org/wiki/File:Tour_la_Nuit_Montreal_2019_approaching_Olympic_Stadium.jpg), CC BY-SA 4.0, Kenneth C. Zirkel.
- `elephant-camp.jpg`: [Dubare elephant camp (4).jpg](https://commons.wikimedia.org/wiki/File:Dubare_elephant_camp_(4).jpg), CC BY-SA 4.0, Vinayaraj.
- `fishermens-cove.jpg`: [Fishermen at Kavarathi, Lakshadweep, India (edit).jpg](https://commons.wikimedia.org/wiki/File:Fishermen_at_Kavarathi,_Lakshadweep,_India_(edit).jpg), CC BY-SA 4.0, Shafeeq Thamarassery (derivative work).
- `fort.jpg`: [Champaner citadel walls.jpg](https://commons.wikimedia.org/wiki/File:Champaner_citadel_walls.jpg), CC BY-SA 3.0, Anahgem.
- `gallery-of-modern-art.jpg`: [National Gallery of Modern Art - NGMA - Bangalore 6645.JPG](https://commons.wikimedia.org/wiki/File:National_Gallery_of_Modern_Art_-_NGMA_-_Bangalore_6645.JPG), CC BY-SA 3.0, Rameshng.
- `great-mosque.jpg`: [20191203 Jama Masjid, Delhi 0707 6468 DxO.jpg](https://commons.wikimedia.org/wiki/File:20191203_Jama_Masjid,_Delhi_0707_6468_DxO.jpg), CC BY-SA 4.0, Jakub Hałun.
- `handloom-cooperative.jpg`: [Complicated hand-loom for silk weaving, Kanchipuram, Tamil Nadu.jpg](https://commons.wikimedia.org/wiki/File:Complicated_hand-loom_for_silk_weaving,_Kanchipuram,_Tamil_Nadu.jpg), CC BY 2.0, McKay Savage.
- `hilltop-shrine.jpg`: [Palani Steps to Hill Temple.JPG](https://commons.wikimedia.org/wiki/File:Palani_Steps_to_Hill_Temple.JPG), CC BY-SA 3.0, Ranjithsiji.
- `hot-air-balloon-field.jpg`: [Hot Air Balloon Ride by Sky Waltz.jpg](https://commons.wikimedia.org/wiki/File:Hot_Air_Balloon_Ride_by_Sky_Waltz.jpg), public domain, Meeta.
- `hot-springs.jpg`: [Dead trees at Mammoth Hot Springs.jpg](https://commons.wikimedia.org/wiki/File:Dead_trees_at_Mammoth_Hot_Springs.jpg), CC BY-SA 3.0, Brocken Inaglory.
- `jain-temple-complex.jpg`: [Jain Temple Ranakpur.jpg](https://commons.wikimedia.org/wiki/File:Jain_Temple_Ranakpur.jpg), CC BY-SA 3.0, Ingo Mehling.
- `jazz-cellar.jpg`: [The Spotted Cat New Orleans 2015 - Shotgun Jazz Band.jpg](https://commons.wikimedia.org/wiki/File:The_Spotted_Cat_New_Orleans_2015_-_Shotgun_Jazz_Band.jpg), CC BY-SA 2.0, Gary J. Wood.
- `kayaking.jpg`: [Evening Sunset kayaking view.jpg](https://commons.wikimedia.org/wiki/File:Evening_Sunset_kayaking_view.jpg), CC BY-SA 4.0, Prahallads.
- `lake.jpg`: [Ulsoor Lake, Bangalore.jpg](https://commons.wikimedia.org/wiki/File:Ulsoor_Lake,_Bangalore.jpg), CC BY 2.0, Abhishek Kumar.
- `lighthouse-beach.jpg`: [Kovalam beach trivandrum kerala.jpg](https://commons.wikimedia.org/wiki/File:Kovalam_beach_trivandrum_kerala.jpg), CC BY-SA 4.0, Georgeumartin.
- `maritime-museum.jpg`: [Ship models, North Devon Maritime Museum.jpg](https://commons.wikimedia.org/wiki/File:Ship_models,_North_Devon_Maritime_Museum.jpg), CC0, Northerner.
- `museum-of-coins.jpg`: [Coin collection.jpg](https://commons.wikimedia.org/wiki/File:Coin_collection.jpg), CC BY-SA 4.0, Anemonemma, Generalissima, 3df.
- `night-food-bazaar.jpg`: [SZ Shenzhen Luohu Dongmen night market shop cooked food March 2025 R12S 211.jpg](https://commons.wikimedia.org/wiki/File:SZ_Shenzhen_Luohu_Dongmen_night_market_shop_cooked_food_March_2025_R12S_211.jpg), CC0, Breandy Makallonz.
- `north-beach.jpg`: [Havelock Island, Sandy lagoon, Andaman Islands.jpg](https://commons.wikimedia.org/wiki/File:Havelock_Island,_Sandy_lagoon,_Andaman_Islands.jpg), CC BY 4.0, Vyacheslav Argenberg.
- `observatory.jpg`: [Doors of Jantar Mantar.jpg](https://commons.wikimedia.org/wiki/File:Doors_of_Jantar_Mantar.jpg), CC BY-SA 4.0, Sudipta Maulik.
- `old-palace.jpg`: [Mysore Palace Windows.jpg](https://commons.wikimedia.org/wiki/File:Mysore_Palace_Windows.jpg), CC BY-SA 4.0, Sumit Surai.
- `paragliding-launch.jpg`: [Pilots on a paragliding takeoff at Bir-Billing.JPG](https://commons.wikimedia.org/wiki/File:Pilots_on_a_paragliding_takeoff_at_Bir-Billing.JPG), CC BY-SA 3.0, Okorok.
- `puppet-museum.jpg`: [Kathputli ke dhage.jpg](https://commons.wikimedia.org/wiki/File:Kathputli_ke_dhage.jpg), CC BY-SA 4.0, Vicky Puppeteer.
- `quiet-bay.jpg`: [El Guamache Bay, Margarita island.jpg](https://commons.wikimedia.org/wiki/File:El_Guamache_Bay,_Margarita_island.jpg), CC0, Wilfredor.
- `ridge-lookout.jpg`: [Zagedan Ridge, Zagedan Valley, Caucasus Mountains, Karachay-Cherkessia.jpg](https://commons.wikimedia.org/wiki/File:Zagedan_Ridge,_Zagedan_Valley,_Caucasus_Mountains,_Karachay-Cherkessia.jpg), CC BY 4.0, Vyacheslav Argenberg.
- `riverside-ghats.jpg`: [Varanasi Munshi Ghat3.jpg](https://commons.wikimedia.org/wiki/File:Varanasi_Munshi_Ghat3.jpg), CC BY-SA 3.0, Marcin Białek.
- `riverside-lounge.jpg`: [DZ6 2225 Riverside dining under temple lights - a bustling night market and restaurant glow against an ornate temple silhouette.jpg](https://commons.wikimedia.org/wiki/File:DZ6_2225_Riverside_dining_under_temple_lights_-_a_bustling_night_market_and_restaurant_glow_against_an_ornate_temple_silhouette.jpg), CC BY-SA 4.0, PattayaPatrol.
- `rock-climbing-wall.jpg`: [Climbing wall 20211103 145408.jpg](https://commons.wikimedia.org/wiki/File:Climbing_wall_20211103_145408.jpg), CC BY-SA 4.0, Ka23 13.
- `rock-garden.jpg`: [Nek Chand Garden (6175284222).jpg](https://commons.wikimedia.org/wiki/File:Nek_Chand_Garden_(6175284222).jpg), CC BY-SA 2.0, Rod Waddington from Kergunyah, Australia.
- `rooftop-live-music.jpg`: [Music band performs on stage during a live concert.jpg](https://commons.wikimedia.org/wiki/File:Music_band_performs_on_stage_during_a_live_concert.jpg), CC BY 2.0, Shixart1985.
- `royal-cenotaphs.jpg`: [Royal Cenotaphs, Bada Bagh, Jaisalmer (retouched).jpg](https://commons.wikimedia.org/wiki/File:Royal_Cenotaphs,_Bada_Bagh,_Jaisalmer_(retouched).jpg), CC BY-SA 3.0, Ankit khare derivative work: MagentaGreen.
- `spice-market-walk.jpg`: [20191205 Spice market, Old Delhi 0711 6765.jpg](https://commons.wikimedia.org/wiki/File:20191205_Spice_market,_Old_Delhi_0711_6765.jpg), CC BY-SA 4.0, Jakub Hałun.
- `st-marys-church.jpg`: [St. Mary's Basilica Bangalore pillar.jpg](https://commons.wikimedia.org/wiki/File:St._Mary%27s_Basilica_Bangalore_pillar.jpg), CC BY-SA 3.0, Tinucherian (talk).
- `stepwell.jpg`: [Chand Baori, stepwell.jpg](https://commons.wikimedia.org/wiki/File:Chand_Baori,_stepwell.jpg), CC BY 2.0, Pablo Nicolás Taibi Cicare.
- `street-food-lane.jpg`: [Pani Puri Stall - Kolkata 2013-10-11 3268.JPG](https://commons.wikimedia.org/wiki/File:Pani_Puri_Stall_-_Kolkata_2013-10-11_3268.JPG), CC BY 3.0, Biswarup Ganguly.
- `sunset-point.jpg`: [Hampi, India, Rocky landscape of Hampi, Granite rocks of Matanga Hill.jpg](https://commons.wikimedia.org/wiki/File:Hampi,_India,_Rocky_landscape_of_Hampi,_Granite_rocks_of_Matanga_Hill.jpg), CC BY 4.0, Vyacheslav Argenberg.
- `tea-estate-trail.jpg`: [Tea Estate Munnar.jpg](https://commons.wikimedia.org/wiki/File:Tea_Estate_Munnar.jpg), CC BY-SA 3.0, Nikolas Becker.
- `temple.jpg`: [A Hindu temple gopuram in Chennai India.jpg](https://commons.wikimedia.org/wiki/File:A_Hindu_temple_gopuram_in_Chennai_India.jpg), CC BY-SA 2.0, Johann-Nikolaus Andreae from Hamburg, Germany.
- `textile-museum.jpg`: [Jacket, India (fabric), Iran (tailoring), Safavid dynasty, late 17th century AD, silk, metal-wrapped silk, silver foil, view 4 - Textile Museum, George Washington University - DSC09609.JPG](https://commons.wikimedia.org/wiki/File:Jacket,_India_(fabric),_Iran_(tailoring),_Safavid_dynasty,_late_17th_century_AD,_silk,_metal-wrapped_silk,_silver_foil,_view_4_-_Textile_Museum,_George_Washington_University_-_DSC09609.JPG), public domain, Daderot.
- `viewpoint.jpg`: [Indus Valley near Leh.jpg](https://commons.wikimedia.org/wiki/File:Indus_Valley_near_Leh.jpg), CC BY-SA 3.0, KennyOMG.
- `watchtower-terrace.jpg`: [View from Hatta Hill Park Watchtower.jpg](https://commons.wikimedia.org/wiki/File:View_from_Hatta_Hill_Park_Watchtower.jpg), CC BY-SA 4.0, Florian Kriechbaumer.
- `water-palace.jpg`: [Jalmahal jaipur 2013.JPG](https://commons.wikimedia.org/wiki/File:Jalmahal_jaipur_2013.JPG), CC BY-SA 3.0, Arjuncm3.
- `zipline-point.jpg`: [Zip line over the falls of Li Phi at sunrise in Don Khon Laos.jpg](https://commons.wikimedia.org/wiki/File:Zip_line_over_the_falls_of_Li_Phi_at_sunrise_in_Don_Khon_Laos.jpg), CC BY-SA 4.0, Basile Morin.
