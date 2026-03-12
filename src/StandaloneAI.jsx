  const generateIcebreaker = (overrideRegion) => {
    const h = new Date().getHours();
    const activeRegion = overrideRegion || region;
    const regionName = REGIONS.find(r => r.id === activeRegion)?.name || "Jadran";
    const isCamperMode = travelMode === "camper" || niche === "camper";
    const isSailing = travelMode === "sailing" || niche === "sailing";
    const isCruiser = travelMode === "cruiser" || niche === "cruiser";
    const w = weather;
    const wxLine = w ? `${w.temp}°C, more ${w.sea}°C, vjetar ${w.windDir || ""} ${w.windSpeed || ""} km/h.` : "";

    let isReturning = false;
    let visitCount = 1;
    try {
      const lastVisit = localStorage.getItem("jadran_last_chat");
      const vc = parseInt(localStorage.getItem("jadran_visit_count") || "0");
      visitCount = vc + 1;
      localStorage.setItem("jadran_visit_count", String(visitCount));
      localStorage.setItem("jadran_last_chat", Date.now().toString());
      if (lastVisit && (Date.now() - parseInt(lastVisit)) / 3600000 >= 4) isReturning = true;
    } catch {}

    if (isReturning) {
      if (h >= 15 && h < 21) {
        return `Dobrodošli natrag. ${wxLine}

${activeRegion === "split" ? "Preporuka za večeru: Konoba Matoni, Podstrana — pašticada 14€, prostran parking." : activeRegion === "istra" ? "Preporuka za večeru: Konoba Batelina, Banjole — svježa riba po kg, ravan parking." : activeRegion === "dubrovnik" ? "Preporuka: Pelješac — stonske kamenice 1€/kom, domaće vino." : "Mogu preporučiti konobe s parkingom u blizini."}

Trebate li navigaciju ili imate drugi plan za večeras?`;
      }
      return `Dobrodošli natrag u ${regionName}. ${wxLine}

Što planirate danas? Mogu preporučiti ${h < 12 ? "jutarnji izlet ili plažu" : h < 17 ? "popodnevnu aktivnost" : "večeru s pogledom"}.`;
    }

    if (w && w.windSpeed > 40) {
      return `Vrijeme u ${regionName} danas zahtijeva oprez. Bura ${w.windSpeed} km/h.

Preporučujem dan u unutrašnjosti: konobe, vinarije, muzeji.

Što vas zanima — hrana, kultura, ili nešto treće?`;
    }

    if (h >= 17 && h < 21) {
      if (isCamperMode) {
        return `Dobra večer. Dobrodošli u ${regionName}. ${wxLine}

${activeRegion === "split" ? "Konoba Matoni, Podstrana — terasa nad morem, pašticada 14€, prostran parking." : activeRegion === "istra" ? "Konoba Batelina, Banjole — svježa riba po kg, ravan parking." : "Imam preporuke za konobe s parkingom u blizini."}

Trebate parking za večeras ili preporuku za sutra?`;
      }
      return `Dobra večer. Dobrodošli u ${regionName}. ${w ? "More " + w.sea + "°C." : ""}

Što planirate za večeras — večera, šetnja rivom, ili noćni izlaz?`;
    }

    if (h >= 6 && h < 10) {
      return `Dobro jutro. Dobrodošli u ${regionName}. ${wxLine || "Prekrasan dan na Jadranu."}

Što planirate danas — plaže, izleti, kultura?`;
    }

    if (isCamperMode) {
      return `Dobrodošli u ${regionName}. Poznajem svaki parking, dump station i skrivenu uvalu na ovom dijelu obale.

${wxLine}

Što vam prvo treba — siguran parking za noćas, preporuka za plažu pristupačnu kamperom, ili nešto treće?`;
    }
    if (isSailing) {
      return `Dobrodošli u ${regionName}. Poznajem svaku marinu, sidrište i konubu do koje se dolazi s mora.

${wxLine}

Trebate preporuku za vez, sigurno sidrište ili večeru na obali?`;
    }
    if (isCruiser) {
      return `Dobrodošli u ${regionName}. Imate ograničeno vrijeme — napravit ćemo plan po minutu.

${wxLine}

U koliko sati se morate vratiti na brod?`;
    }
    return `Dobrodošli u ${regionName}. Poznajem svaku skrivenu plažu i konubu na ovom dijelu obale.

${wxLine} Što vas zanima?`;
  };