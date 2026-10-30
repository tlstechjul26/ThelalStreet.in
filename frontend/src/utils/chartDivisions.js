/**
 * Computes dynamic date-axis divisions and colored timeline segments
 * based on actual calendar dates and historical data observations.
 * 
 * Rules:
 * - 1D: Intraday time labels (hours / trading sessions).
 * - 1W: Trading days (Fri, Mon, Tue, etc.).
 * - 1M: Five approximately evenly spaced date divisions across the month.
 * - 1Y: Calendar quarters.
 * - 5Y: Six readable divisions: four complete calendar-year markers and two boundary markers.
 * - Max: Readable long-term date markers based on asset history.
 * - SIP: Yearly/monthly investment markers.
 * 
 * Each segment between markers is colored Green (#16B85A) if its end >= start, or Red (#eb5b3c) if end < start.
 */

export function calculateTimelineSegments(timeframe = '1y', sortedPoints = []) {
  if (!sortedPoints || sortedPoints.length === 0) {
    return { divisions: [], segments: [] };
  }

  const tf = String(timeframe || '').toLowerCase();
  const startTime = sortedPoints[0].time > 100000000000 ? sortedPoints[0].time : sortedPoints[0].time * 1000;
  const endTime = sortedPoints[sortedPoints.length - 1].time > 100000000000 
    ? sortedPoints[sortedPoints.length - 1].time 
    : sortedPoints[sortedPoints.length - 1].time * 1000;
  const totalDuration = Math.max(1, endTime - startTime);

  // Helper to find nearest data point to a given timestamp
  const findNearestPoint = (targetTime) => {
    let best = sortedPoints[0];
    let bestDiff = Math.abs((best.time > 100000000000 ? best.time : best.time * 1000) - targetTime);

    for (let i = 1; i < sortedPoints.length; i++) {
      const pt = sortedPoints[i];
      const ptTime = pt.time > 100000000000 ? pt.time : pt.time * 1000;
      const diff = Math.abs(ptTime - targetTime);
      if (diff < bestDiff) {
        bestDiff = diff;
        best = pt;
      }
    }
    return best;
  };

  const divisions = [];

  // --- 1D: Intraday divisions (hours/sessions) ---
  if (tf === '1d') {
    // Check if points are intraday (spanning minutes/hours)
    const spanHours = (endTime - startTime) / (3600 * 1000);
    if (spanHours > 2 && sortedPoints.length >= 5) {
      const numDivisions = 5;
      for (let i = 0; i < numDivisions; i++) {
        const targetT = startTime + (i / (numDivisions - 1)) * totalDuration;
        const pt = findNearestPoint(targetT);
        const ptTime = pt.time > 100000000000 ? pt.time : pt.time * 1000;
        const d = new Date(ptTime);
        const label = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
        divisions.push({
          label,
          time: ptTime,
          price: Number(pt.close ?? pt.value),
          leftPct: ((ptTime - startTime) / totalDuration) * 100
        });
      }
    } else {
      // EOD data fallback (e.g. mutual fund recent 2 declarations)
      sortedPoints.forEach((pt) => {
        const ptTime = pt.time > 100000000000 ? pt.time : pt.time * 1000;
        const d = new Date(ptTime);
        divisions.push({
          label: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
          time: ptTime,
          price: Number(pt.close ?? pt.value),
          leftPct: ((ptTime - startTime) / totalDuration) * 100
        });
      });
    }
  }

  // --- 1W: Trading Days (Fri, Mon, Tue, etc.) ---
  else if (tf === '1w') {
    // Group points by unique calendar date
    const dayMap = new Map();
    sortedPoints.forEach(pt => {
      const ptTime = pt.time > 100000000000 ? pt.time : pt.time * 1000;
      const d = new Date(ptTime);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!dayMap.has(key)) {
        dayMap.set(key, pt);
      }
    });

    const uniqueDays = Array.from(dayMap.values());
    uniqueDays.forEach(pt => {
      const ptTime = pt.time > 100000000000 ? pt.time : pt.time * 1000;
      const d = new Date(ptTime);
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      divisions.push({
        label: dayName,
        time: ptTime,
        price: Number(pt.close ?? pt.value),
        leftPct: ((ptTime - startTime) / totalDuration) * 100
      });
    });
  }

  // --- 1M: Five approximately evenly spaced date divisions across the selected month ---
  else if (tf === '1m' || tf === '1mo') {
    const numDivisions = 5;
    for (let i = 0; i < numDivisions; i++) {
      const targetT = startTime + (i / (numDivisions - 1)) * totalDuration;
      const pt = findNearestPoint(targetT);
      const ptTime = pt.time > 100000000000 ? pt.time : pt.time * 1000;
      const d = new Date(ptTime);
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      divisions.push({
        label,
        time: ptTime,
        price: Number(pt.close ?? pt.value),
        leftPct: ((ptTime - startTime) / totalDuration) * 100
      });
    }
  }

  // --- 1Y: Calendar Quarters (Tickertape style: 5 quarterly boundary markers e.g. Oct '25, Jan '26, Apr '26, Jul '26, Oct '26) ---
  else if (tf === '1y') {
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);
    const quarterStarts = [];
    let yr = startDate.getUTCFullYear();
    const endYr = endDate.getUTCFullYear();

    while (yr <= endYr) {
      for (const m of [0, 3, 6, 9]) {
        const qT = new Date(Date.UTC(yr, m, 1)).getTime();
        // Buffer of 35 days (~1 month) before end / after start to avoid duplicate boundary quarters
        if (qT > startTime + 35 * 86400000 && qT < endTime - 35 * 86400000) {
          quarterStarts.push(qT);
        }
      }
      yr++;
    }

    if (quarterStarts.length >= 3) {
      // Starting boundary marker
      const sMonth = startDate.toLocaleDateString('en-US', { month: 'short' });
      const sYy = startDate.getFullYear().toString().slice(-2);
      const sQ = Math.floor(startDate.getMonth() / 3) + 1;
      divisions.push({
        label: `${sMonth} '${sYy}`,
        quarter: `Q${sQ} '${sYy}`,
        time: startTime,
        price: Number(sortedPoints[0].close ?? sortedPoints[0].value),
        leftPct: 0
      });

      // Calendar quarter markers
      for (const qT of quarterStarts) {
        const pt = findNearestPoint(qT);
        const ptTime = pt.time > 100000000000 ? pt.time : pt.time * 1000;
        const d = new Date(qT);
        const mShort = d.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' });
        const yy = d.getUTCFullYear().toString().slice(-2);
        const q = Math.floor(d.getUTCMonth() / 3) + 1;
        divisions.push({
          label: `${mShort} '${yy}`,
          quarter: `Q${q} '${yy}`,
          time: ptTime,
          price: Number(pt.close ?? pt.value),
          leftPct: ((ptTime - startTime) / totalDuration) * 100
        });
      }

      // Ending boundary marker
      const eMonth = endDate.toLocaleDateString('en-US', { month: 'short' });
      const eYy = endDate.getFullYear().toString().slice(-2);
      const eQ = Math.floor(endDate.getMonth() / 3) + 1;
      divisions.push({
        label: `${eMonth} '${eYy}`,
        quarter: `Q${eQ} '${eYy}`,
        time: endTime,
        price: Number(sortedPoints[sortedPoints.length - 1].close ?? sortedPoints[sortedPoints.length - 1].value),
        leftPct: 100
      });
    } else {
      const numDivisions = 5;
      for (let i = 0; i < numDivisions; i++) {
        const targetT = startTime + (i / (numDivisions - 1)) * totalDuration;
        const pt = (i === 0) ? sortedPoints[0] : (i === numDivisions - 1 ? sortedPoints[sortedPoints.length - 1] : findNearestPoint(targetT));
        const ptTime = (i === 0) ? startTime : (i === numDivisions - 1 ? endTime : (pt.time > 100000000000 ? pt.time : pt.time * 1000));
        const d = new Date(ptTime);
        const monthShort = d.toLocaleDateString('en-US', { month: 'short' });
        const yy = d.getFullYear().toString().slice(-2);
        const label = `${monthShort} '${yy}`;
        const month = d.getMonth();
        const q = Math.floor(month / 3) + 1;
        const quarter = `Q${q} '${yy}`;
        divisions.push({
          label,
          quarter,
          time: ptTime,
          price: Number(pt.close ?? pt.value),
          leftPct: (i === 0) ? 0 : (i === numDivisions - 1 ? 100 : ((ptTime - startTime) / totalDuration) * 100)
        });
      }
    }
  }

  // --- 3M: Monthly intervals across 3 months ---
  else if (tf === '3m') {
    const numDivisions = 4;
    for (let i = 0; i < numDivisions; i++) {
      const targetT = startTime + (i / (numDivisions - 1)) * totalDuration;
      const pt = (i === 0) ? sortedPoints[0] : (i === numDivisions - 1 ? sortedPoints[sortedPoints.length - 1] : findNearestPoint(targetT));
      const ptTime = (i === 0) ? startTime : (i === numDivisions - 1 ? endTime : (pt.time > 100000000000 ? pt.time : pt.time * 1000));
      const d = new Date(ptTime);
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      divisions.push({
        label,
        time: ptTime,
        price: Number(pt.close ?? pt.value),
        leftPct: (i === 0) ? 0 : (i === numDivisions - 1 ? 100 : ((ptTime - startTime) / totalDuration) * 100)
      });
    }
  }

  // --- 6M: Bi-monthly or monthly divisions ---
  else if (tf === '6m') {
    const numDivisions = 5;
    for (let i = 0; i < numDivisions; i++) {
      const targetT = startTime + (i / (numDivisions - 1)) * totalDuration;
      const pt = (i === 0) ? sortedPoints[0] : (i === numDivisions - 1 ? sortedPoints[sortedPoints.length - 1] : findNearestPoint(targetT));
      const ptTime = (i === 0) ? startTime : (i === numDivisions - 1 ? endTime : (pt.time > 100000000000 ? pt.time : pt.time * 1000));
      const d = new Date(ptTime);
      const label = `${d.toLocaleDateString('en-US', { month: 'short' })} '${d.getFullYear().toString().slice(-2)}`;
      divisions.push({
        label,
        time: ptTime,
        price: Number(pt.close ?? pt.value),
        leftPct: (i === 0) ? 0 : (i === numDivisions - 1 ? 100 : ((ptTime - startTime) / totalDuration) * 100)
      });
    }
  }

  // --- 3Y: Yearly divisions ---
  else if (tf === '3y') {
    const numDivisions = 4;
    for (let i = 0; i < numDivisions; i++) {
      const targetT = startTime + (i / (numDivisions - 1)) * totalDuration;
      const pt = (i === 0) ? sortedPoints[0] : (i === numDivisions - 1 ? sortedPoints[sortedPoints.length - 1] : findNearestPoint(targetT));
      const ptTime = (i === 0) ? startTime : (i === numDivisions - 1 ? endTime : (pt.time > 100000000000 ? pt.time : pt.time * 1000));
      const d = new Date(ptTime);
      const label = `${d.toLocaleDateString('en-US', { month: 'short' })} '${d.getFullYear().toString().slice(-2)}`;
      divisions.push({
        label,
        time: ptTime,
        price: Number(pt.close ?? pt.value),
        leftPct: (i === 0) ? 0 : (i === numDivisions - 1 ? 100 : ((ptTime - startTime) / totalDuration) * 100)
      });
    }
  }

  // --- 5Y: Six readable divisions (two boundary markers + four calendar-year markers) ---
  else if (tf === '5y') {
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);
    const startYear = startDate.getFullYear();
    const endYear = endDate.getFullYear();

    // Boundary 1: Starting year boundary (e.g. "Oct '21")
    const b1Label = `${startDate.toLocaleDateString('en-US', { month: 'short' })} '${startYear.toString().slice(-2)}`;
    divisions.push({
      label: b1Label,
      time: startTime,
      price: Number(sortedPoints[0].close ?? sortedPoints[0].value),
      leftPct: 0
    });

    // Four calendar year markers (e.g. Jan '22, Jan '23, Jan '24, Jan '25)
    for (let y = startYear + 1; y < endYear; y++) {
      const janDate = new Date(Date.UTC(y, 0, 1));
      const pt = findNearestPoint(janDate.getTime());
      const ptTime = pt.time > 100000000000 ? pt.time : pt.time * 1000;
      divisions.push({
        label: `Jan '${y.toString().slice(-2)}`,
        time: ptTime,
        price: Number(pt.close ?? pt.value),
        leftPct: ((ptTime - startTime) / totalDuration) * 100
      });
    }

    // Final boundary marker: January of end year (e.g. "Jan '26") if not too close to the end
    const finalJan = new Date(Date.UTC(endYear, 0, 1));
    const ptFinal = findNearestPoint(finalJan.getTime());
    const ptFinalTime = ptFinal.time > 100000000000 ? ptFinal.time : ptFinal.time * 1000;
    if (ptFinalTime > startTime + 35 * 86400000 && ptFinalTime < endTime - 35 * 86400000) {
      divisions.push({
        label: `Jan '${endYear.toString().slice(-2)}`,
        time: ptFinalTime,
        price: Number(ptFinal.close ?? ptFinal.value),
        leftPct: ((ptFinalTime - startTime) / totalDuration) * 100
      });
    }

    // Ending boundary marker at 100% (e.g. "Oct '26")
    const eMonth = endDate.toLocaleDateString('en-US', { month: 'short' });
    const eYy = endDate.getFullYear().toString().slice(-2);
    divisions.push({
      label: `${eMonth} '${eYy}`,
      time: endTime,
      price: Number(sortedPoints[sortedPoints.length - 1].close ?? sortedPoints[sortedPoints.length - 1].value),
      leftPct: 100
    });
  }

  // --- Max / All: Readable long-term markers ---
  else if (tf === 'max' || tf === 'all') {
    const numDivisions = 5;
    for (let i = 0; i < numDivisions; i++) {
      const targetT = startTime + (i / (numDivisions - 1)) * totalDuration;
      const pt = findNearestPoint(targetT);
      const ptTime = pt.time > 100000000000 ? pt.time : pt.time * 1000;
      const d = new Date(ptTime);
      const label = `${d.toLocaleDateString('en-US', { month: 'short' })} '${d.getFullYear().toString().slice(-2)}`;
      divisions.push({
        label,
        time: ptTime,
        price: Number(pt.close ?? pt.value),
        leftPct: ((ptTime - startTime) / totalDuration) * 100
      });
    }
  }

  // --- SIP: Monthly investment / yearly markers ---
  else if (tf === 'sip') {
    const numDivisions = 5;
    for (let i = 0; i < numDivisions; i++) {
      const targetT = startTime + (i / (numDivisions - 1)) * totalDuration;
      const pt = findNearestPoint(targetT);
      const ptTime = pt.time > 100000000000 ? pt.time : pt.time * 1000;
      const d = new Date(ptTime);
      const label = `${d.toLocaleDateString('en-US', { month: 'short' })} '${d.getFullYear().toString().slice(-2)}`;
      divisions.push({
        label,
        time: ptTime,
        price: Number(pt.close ?? pt.value),
        leftPct: ((ptTime - startTime) / totalDuration) * 100
      });
    }
  }

  // Default fallback
  else {
    const numDivisions = 4;
    for (let i = 0; i < numDivisions; i++) {
      const targetT = startTime + (i / (numDivisions - 1)) * totalDuration;
      const pt = findNearestPoint(targetT);
      const ptTime = pt.time > 100000000000 ? pt.time : pt.time * 1000;
      const d = new Date(ptTime);
      divisions.push({
        label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        time: ptTime,
        price: Number(pt.close ?? pt.value),
        leftPct: ((ptTime - startTime) / totalDuration) * 100
      });
    }
  }

  // Deduplicate divisions by timestamp
  const dedupedDivisions = [];
  const seenTimes = new Set();
  divisions.forEach(d => {
    if (!seenTimes.has(d.time)) {
      seenTimes.add(d.time);
      dedupedDivisions.push(d);
    }
  });

  // Sort divisions ascending
  dedupedDivisions.sort((a, b) => a.time - b.time);

  // Compute colored timeline segments between consecutive division markers
  const toMs = (t) => (t > 100000000000 ? t : t * 1000);
  const segments = [];
  for (let i = 0; i < dedupedDivisions.length - 1; i++) {
    const dStart = dedupedDivisions[i];
    const dEnd = dedupedDivisions[i + 1];
    const isLastDivision = (i === dedupedDivisions.length - 2);

    // Find actual data points that fall within this segment
    // Non-final segments strictly end before dEnd.time to prevent boundary overlap with next segment
    const ptsInSeg = sortedPoints.filter(p => {
      const ptT = toMs(p.time);
      return isLastDivision 
        ? (ptT >= dStart.time && ptT <= dEnd.time)
        : (ptT >= dStart.time && ptT < dEnd.time);
    });

    const startPt = ptsInSeg.length > 0 ? ptsInSeg[0] : findNearestPoint(dStart.time);
    const endPt = ptsInSeg.length > 0 
      ? ptsInSeg[ptsInSeg.length - 1] 
      : (isLastDivision ? findNearestPoint(dEnd.time) : startPt);

    const startPtTime = toMs(startPt.time);
    const endPtTime = toMs(endPt.time);
    const startPtPrice = Number(startPt.close ?? startPt.value);
    const endPtPrice = Number(endPt.close ?? endPt.value);

    const diff = Number((endPtPrice - startPtPrice).toFixed(2));
    const isGain = diff >= 0;
    const widthPct = Math.max(0.5, dEnd.leftPct - dStart.leftPct);

    // Readable end label derived from the segment's actual end date
    const endD = new Date(endPtTime);
    const endLabel = (tf === '5y' || tf === 'max')
      ? `${endD.toLocaleDateString('en-US', { month: 'short' })} '${endD.getFullYear().toString().slice(-2)}`
      : endD.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    segments.push({
      startLabel: dStart.label,
      endLabel: isLastDivision ? dEnd.label : endLabel,
      startTime: dStart.time,
      endTime: isLastDivision ? dEnd.time : endPtTime,
      nextDivisionTime: dEnd.time,
      startPrice: startPtPrice,
      endPrice: endPtPrice,
      diff,
      isGain,
      color: isGain ? '#16B85A' : '#eb5b3c',
      leftPct: dStart.leftPct,
      widthPct
    });
  }

  // If the last division is not at 100%, add a tail segment to the end
  if (dedupedDivisions.length > 0) {
    const lastDiv = dedupedDivisions[dedupedDivisions.length - 1];
    if (lastDiv.leftPct < 98) {
      const lastPt = sortedPoints[sortedPoints.length - 1];
      const lastPtPrice = Number(lastPt.close ?? lastPt.value);
      const diff = Number((lastPtPrice - lastDiv.price).toFixed(2));
      const isGain = diff >= 0;
      const widthPct = Math.max(0.5, 100 - lastDiv.leftPct);

      segments.push({
        startLabel: lastDiv.label,
        endLabel: 'End',
        startTime: lastDiv.time,
        endTime: endTime,
        nextDivisionTime: endTime,
        startPrice: lastDiv.price,
        endPrice: lastPtPrice,
        diff,
        isGain,
        color: isGain ? '#16B85A' : '#eb5b3c',
        leftPct: lastDiv.leftPct,
        widthPct
      });
    }
  }

  return {
    divisions: dedupedDivisions,
    segments
  };
}
