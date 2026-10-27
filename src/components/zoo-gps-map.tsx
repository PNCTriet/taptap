"use client";

import React from "react";
import Link from "next/link";
import type * as LeafletNamespace from "leaflet";
import {
  CheckCircle2,
  Compass,
  Footprints,
  Loader2,
  LocateFixed,
  MapPin,
  Navigation as NavigationIcon,
  Radio,
  RotateCcw,
} from "lucide-react";
import { useExplorer } from "@/context/explorer-context";
import {
  SAIGON_ZOO_CENTER,
  SAIGON_ZOO_DEMO_TRAIL,
  calculateDistanceMeters,
  formatDistance,
  getWalkingDirectionsUrl,
  type GeoPoint,
} from "@/lib/geo";
import {
  StationIllustration,
  getStationPinHtml,
} from "@/components/station-artwork";
import { AppIcon } from "@/components/ui/app-icon";

export interface ZooGpsMapProps {
  initialStationSlug?: string;
  compact?: boolean;
  onDistancesChange?: (distances: Record<string, number>) => void;
}

interface UserGpsState extends GeoPoint {
  accuracy: number;
  mode: "live" | "demo";
  source: "live" | "demo";
}

export function ZooGpsMap({
  initialStationSlug,
  compact = false,
  onDistancesChange,
}: ZooGpsMapProps) {
  const { locale, t, stations, isStationCollected } = useExplorer();

  const sortedStations = React.useMemo(() => {
    return stations
      .slice()
      .sort((a, b) => a.stamp.sortOrder - b.stamp.sortOrder);
  }, [stations]);

  const [selectedStationId, setSelectedStationId] = React.useState<string>(
    () => {
      if (initialStationSlug) {
        const found = sortedStations.find(
          (s) => s.slug === initialStationSlug
        );
        if (found) return found.id;
      }
      return sortedStations[0]?.id ?? "";
    }
  );

  const [userGps, setUserGps] = React.useState<UserGpsState | null>(null);
  const [isLocating, setIsLocating] = React.useState(false);
  const [gpsError, setGpsError] = React.useState<string | null>(null);
  const [isDemoWalking, setIsDemoWalking] = React.useState(false);

  const mapContainerRef = React.useRef<HTMLDivElement | null>(null);
  const leafletRef = React.useRef<typeof LeafletNamespace | null>(null);
  const mapInstanceRef = React.useRef<LeafletNamespace.Map | null>(null);
  const stationMarkersRef = React.useRef<
    Map<string, LeafletNamespace.Marker>
  >(new Map());
  const userMarkerRef = React.useRef<LeafletNamespace.Marker | null>(null);
  const userAccuracyCircleRef = React.useRef<LeafletNamespace.Circle | null>(
    null
  );
  const walkingLineRef = React.useRef<LeafletNamespace.Polyline | null>(null);
  const watchIdRef = React.useRef<number | null>(null);
  const shouldCenterOnNextFixRef = React.useRef<boolean>(false);
  const hasRetriedLowAccuracyRef = React.useRef<boolean>(false);
  const prevSelectedStationIdRef = React.useRef<string>(selectedStationId);

  const selectedStation = React.useMemo(() => {
    return (
      sortedStations.find((s) => s.id === selectedStationId) ??
      sortedStations[0] ??
      null
    );
  }, [sortedStations, selectedStationId]);

  const stationDistances = React.useMemo(() => {
    const map: Record<string, number> = {};
    if (!userGps) return map;
    for (const st of sortedStations) {
      map[st.id] = calculateDistanceMeters(
        userGps.lat,
        userGps.lng,
        st.latitude,
        st.longitude
      );
    }
    return map;
  }, [sortedStations, userGps]);

  React.useEffect(() => {
    if (onDistancesChange) {
      onDistancesChange(stationDistances);
    }
  }, [stationDistances, onDistancesChange]);

  const distanceToZooCenter = React.useMemo(() => {
    if (!userGps) return null;
    return calculateDistanceMeters(
      userGps.lat,
      userGps.lng,
      SAIGON_ZOO_CENTER.lat,
      SAIGON_ZOO_CENTER.lng
    );
  }, [userGps]);

  // Initialize Leaflet Map once on client
  React.useEffect(() => {
    let cancelled = false;

    async function initMap() {
      if (!mapContainerRef.current || mapInstanceRef.current) return;
      const L = await import("leaflet");
      if (cancelled || !mapContainerRef.current) return;

      leafletRef.current = L;

      const map = L.map(mapContainerRef.current, {
        center: [SAIGON_ZOO_CENTER.lat, SAIGON_ZOO_CENTER.lng],
        zoom: compact ? 16 : 17,
        zoomControl: false,
        attributionControl: false,
      });

      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap",
      }).addTo(map);

      if (!compact) {
        L.control.zoom({ position: "bottomright" }).addTo(map);
      }

      // Saigon Zoo & Botanical Gardens (Thảo Cầm Viên Sài Gòn) canopy & park boundary highlight
      const zooParkBoundary: [number, number][] = [
        [10.7864, 106.7042],
        [10.7863, 106.7057],
        [10.7874, 106.7069],
        [10.7893, 106.7068],
        [10.7902, 106.7058],
        [10.7901, 106.7044],
        [10.7885, 106.7039],
      ];

      L.polygon(zooParkBoundary, {
        color: "#176B61",
        weight: 1.75,
        opacity: 0.42,
        dashArray: "6 6",
        fillColor: "#176B61",
        fillOpacity: 0.06,
        interactive: false,
      }).addTo(map);

      // Botanical Conservatory & central canopy soft circle
      L.circle([SAIGON_ZOO_CENTER.lat, SAIGON_ZOO_CENTER.lng], {
        radius: 175,
        color: "#176B61",
        weight: 1,
        opacity: 0.25,
        dashArray: "4 6",
        fillColor: "#176B61",
        fillOpacity: 0.06,
        interactive: false,
      }).addTo(map);

      // Flamingo Lagoon water highlight near station #3 (10.7886, 106.7061)
      L.circle([10.7886, 106.7061], {
        radius: 48,
        color: "#4D73CF",
        weight: 1.25,
        opacity: 0.35,
        fillColor: "#4D73CF",
        fillOpacity: 0.12,
        interactive: false,
      }).addTo(map);

      const trailCoords: [number, number][] = sortedStations.map((st) => [
        st.latitude,
        st.longitude,
      ]);

      if (trailCoords.length > 1) {
        L.polyline(trailCoords, {
          color: "#FFFDF8",
          weight: 6.5,
          opacity: 0.85,
          lineCap: "round",
          lineJoin: "round",
          interactive: false,
        }).addTo(map);

        L.polyline(trailCoords, {
          color: "#176B61",
          weight: 3.5,
          opacity: 0.72,
          dashArray: "8 8",
          lineCap: "round",
          lineJoin: "round",
          interactive: false,
        }).addTo(map);
      }

      mapInstanceRef.current = map;

      for (const st of sortedStations) {
        const icon = L.divIcon({
          className: "leaflet-div-icon",
          html: getStationPinHtml(st.id, {
            sortOrder: st.stamp.sortOrder,
            collected: isStationCollected(st.id),
            selected: st.id === selectedStationId,
          }),
          iconSize: [48, 54],
          iconAnchor: [24, 52],
        });

        const marker = L.marker([st.latitude, st.longitude], { icon })
          .addTo(map)
          .on("click", () => {
            setSelectedStationId(st.id);
          });

        stationMarkersRef.current.set(st.id, marker);
      }
    }

    const markersMap = stationMarkersRef.current;
    void initMap();

    return () => {
      cancelled = true;
      if (watchIdRef.current !== null && "geolocation" in navigator) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      markersMap.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update station pin icons whenever selectedStationId or collected state changes
  React.useEffect(() => {
    const L = leafletRef.current;
    const map = mapInstanceRef.current;
    if (!L || !map) return;

    for (const st of sortedStations) {
      const marker = stationMarkersRef.current.get(st.id);
      if (!marker) continue;

      const icon = L.divIcon({
        className: "leaflet-div-icon",
        html: getStationPinHtml(st.id, {
          sortOrder: st.stamp.sortOrder,
          collected: isStationCollected(st.id),
          selected: st.id === selectedStationId,
        }),
        iconSize: [48, 54],
        iconAnchor: [24, 52],
      });
      marker.setIcon(icon);
    }

    if (
      selectedStation &&
      prevSelectedStationIdRef.current !== selectedStationId
    ) {
      prevSelectedStationIdRef.current = selectedStationId;
      map.panTo([selectedStation.latitude, selectedStation.longitude], {
        animate: true,
        duration: 0.45,
      });
    }
  }, [selectedStationId, sortedStations, selectedStation, isStationCollected]);

  // Update user GPS radar marker & walking line on the Leaflet map
  React.useEffect(() => {
    const L = leafletRef.current;
    const map = mapInstanceRef.current;
    if (!L || !map) return;

    if (!userGps) {
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }
      if (userAccuracyCircleRef.current) {
        userAccuracyCircleRef.current.remove();
        userAccuracyCircleRef.current = null;
      }
      if (walkingLineRef.current) {
        walkingLineRef.current.remove();
        walkingLineRef.current = null;
      }
      return;
    }

    const radarHtml = `
      <div style="position:relative;width:28px;height:28px;display:flex;align-items:center;justify-content:center;">
        <span class="animate-gps-radar" style="position:absolute;width:28px;height:28px;border-radius:9999px;background:rgba(77,115,207,0.38);"></span>
        <span style="position:relative;width:14px;height:14px;border-radius:9999px;background:#4D73CF;border:3px solid #FFFDF8;box-shadow:0 2px 8px rgba(39,46,43,0.35);"></span>
      </div>
    `;

    const radarIcon = L.divIcon({
      className: "leaflet-div-icon",
      html: radarHtml,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });

    if (!userMarkerRef.current) {
      userMarkerRef.current = L.marker([userGps.lat, userGps.lng], {
        icon: radarIcon,
        zIndexOffset: 500,
      }).addTo(map);
    } else {
      userMarkerRef.current.setLatLng([userGps.lat, userGps.lng]);
      userMarkerRef.current.setIcon(radarIcon);
    }

    if (!userAccuracyCircleRef.current) {
      userAccuracyCircleRef.current = L.circle([userGps.lat, userGps.lng], {
        radius: Math.min(Math.max(userGps.accuracy, 10), 80),
        color: "#4D73CF",
        weight: 1,
        fillColor: "#4D73CF",
        fillOpacity: 0.1,
      }).addTo(map);
    } else {
      userAccuracyCircleRef.current.setLatLng([userGps.lat, userGps.lng]);
      userAccuracyCircleRef.current.setRadius(
        Math.min(Math.max(userGps.accuracy, 10), 80)
      );
    }

    if (selectedStation) {
      const coords: [number, number][] = [
        [userGps.lat, userGps.lng],
        [selectedStation.latitude, selectedStation.longitude],
      ];
      if (!walkingLineRef.current) {
        walkingLineRef.current = L.polyline(coords, {
          color: "#4D73CF",
          weight: 3,
          dashArray: "5 7",
          opacity: 0.85,
        }).addTo(map);
      } else {
        walkingLineRef.current.setLatLngs(coords);
      }
    } else if (walkingLineRef.current) {
      walkingLineRef.current.remove();
      walkingLineRef.current = null;
    }
  }, [userGps, selectedStation]);

  // Demo Walk simulator (updates user GPS along Saigon Zoo trail every 1000ms)
  React.useEffect(() => {
    if (!isDemoWalking) return;

    setIsLocating(false);
    setGpsError(null);

    if (watchIdRef.current !== null && "geolocation" in navigator) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(
        [SAIGON_ZOO_CENTER.lat, SAIGON_ZOO_CENTER.lng],
        17,
        { duration: 0.65 }
      );
    }

    let stepIndex = 0;
    const applyStep = (idx: number) => {
      const pt =
        SAIGON_ZOO_DEMO_TRAIL[idx % SAIGON_ZOO_DEMO_TRAIL.length] ??
        SAIGON_ZOO_CENTER;
      setUserGps({
        lat: pt.lat,
        lng: pt.lng,
        accuracy: 12,
        mode: "demo",
        source: "demo",
      });

      let nearestId = selectedStationId;
      let minD = Number.POSITIVE_INFINITY;
      for (const st of sortedStations) {
        const d = calculateDistanceMeters(
          pt.lat,
          pt.lng,
          st.latitude,
          st.longitude
        );
        if (d < minD) {
          minD = d;
          nearestId = st.id;
        }
      }
      setSelectedStationId(nearestId);
    };

    applyStep(0);
    const interval = window.setInterval(() => {
      stepIndex = (stepIndex + 1) % SAIGON_ZOO_DEMO_TRAIL.length;
      applyStep(stepIndex);
    }, 1000);

    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDemoWalking]);

  const handleStartLiveGps = () => {
    setIsDemoWalking(false);
    setGpsError(null);
    shouldCenterOnNextFixRef.current = true;
    hasRetriedLowAccuracyRef.current = false;

    if (userGps?.source === "live" && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([userGps.lat, userGps.lng], 16, {
        duration: 0.75,
      });
    }

    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      setIsLocating(false);
      setGpsError(
        locale === "vi"
          ? "Không lấy được tín hiệu định vị từ thiết bị/macOS (kiểm tra System Settings → Privacy & Security → Location Services)."
          : "Could not acquire location signal from device/macOS (check System Settings → Privacy & Security → Location Services)."
      );
      return;
    }

    setIsLocating(true);

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    const applyLivePosition = (pos: GeolocationPosition) => {
      setIsLocating(false);
      setGpsError(null);

      const nextGps: UserGpsState = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: Math.round(pos.coords.accuracy || 15),
        mode: "live",
        source: "live",
      };
      setUserGps(nextGps);

      const distFromZoo = calculateDistanceMeters(
        nextGps.lat,
        nextGps.lng,
        SAIGON_ZOO_CENTER.lat,
        SAIGON_ZOO_CENTER.lng
      );

      if (shouldCenterOnNextFixRef.current && mapInstanceRef.current) {
        shouldCenterOnNextFixRef.current = false;
        mapInstanceRef.current.flyTo(
          [nextGps.lat, nextGps.lng],
          distFromZoo <= 1500 ? 17 : 16,
          {
            duration: 0.75,
          }
        );
      }
    };

    const setFinalGeolocationError = (error: GeolocationPositionError) => {
      setIsLocating(false);
      if (error.code === 1) {
        setGpsError(
          locale === "vi"
            ? "Trình duyệt hoặc macOS đang chặn quyền Vị trí. Hãy bật quyền Location cho trình duyệt trên thanh địa chỉ hoặc System Settings rồi bấm lại Vị trí của tôi."
            : "Location access is blocked by your browser or macOS. Please allow Location permission in the address bar or System Settings, then tap Locate me again."
        );
      } else {
        setGpsError(
          locale === "vi"
            ? "Không lấy được tín hiệu định vị từ thiết bị/macOS (kiểm tra System Settings → Privacy & Security → Location Services)."
            : "Could not acquire location signal from device/macOS (check System Settings → Privacy & Security → Location Services)."
        );
      }
    };

    const handleTier1Error = (error: GeolocationPositionError) => {
      if (error.code === 1) {
        if (watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current);
          watchIdRef.current = null;
        }
        setFinalGeolocationError(error);
        return;
      }

      if (
        (error.code === 2 || error.code === 3) &&
        !hasRetriedLowAccuracyRef.current
      ) {
        hasRetriedLowAccuracyRef.current = true;
        if (watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current);
          watchIdRef.current = null;
        }

        const tier2Options: PositionOptions = {
          enableHighAccuracy: false,
          timeout: 12000,
          maximumAge: 60000,
        };

        navigator.geolocation.getCurrentPosition(
          applyLivePosition,
          setFinalGeolocationError,
          tier2Options
        );

        watchIdRef.current = navigator.geolocation.watchPosition(
          applyLivePosition,
          setFinalGeolocationError,
          tier2Options
        );
        return;
      }

      setFinalGeolocationError(error);
    };

    // Tier 1: High-accuracy GPS + immediate getCurrentPosition
    navigator.geolocation.getCurrentPosition(
      applyLivePosition,
      handleTier1Error,
      {
        enableHighAccuracy: true,
        timeout: 6000,
        maximumAge: 15000,
      }
    );

    watchIdRef.current = navigator.geolocation.watchPosition(
      applyLivePosition,
      handleTier1Error,
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 10000,
      }
    );
  };

  const handleRecenterZoo = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.flyTo([SAIGON_ZOO_CENTER.lat, SAIGON_ZOO_CENTER.lng], 17, {
      duration: 0.6,
    });
  };

  const handleCenterOnUser = () => {
    if (!userGps || !mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo([userGps.lat, userGps.lng], 16, {
      duration: 0.65,
    });
  };

  const handleFitUserAndZoo = () => {
    if (!userGps || !mapInstanceRef.current) return;
    mapInstanceRef.current.fitBounds(
      [
        [userGps.lat, userGps.lng],
        [SAIGON_ZOO_CENTER.lat, SAIGON_ZOO_CENTER.lng],
      ],
      { padding: [48, 48], maxZoom: 16 }
    );
  };

  const selectedDistance = selectedStation
    ? stationDistances[selectedStation.id] ?? null
    : null;
  const isSelectedCollected = selectedStation
    ? isStationCollected(selectedStation.id)
    : false;

  return (
    <div
      data-testid="zoo-gps-map"
      className="paper-card overflow-hidden"
    >
      {/* Top Floating GPS Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E6DECB] bg-[#FFFDF8] px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[#176B61] animate-pulse" />
          <span className="type-heading text-xs text-[#272E2B]">
            {locale === "vi"
              ? "Bản đồ GPS Thảo Cầm Viên"
              : "Saigon Zoo GPS Trail"}
          </span>
          {userGps && (
            <span className="type-mono rounded-full bg-[#EAF0FB] px-2 py-0.5 text-[10px] font-bold text-[#4D73CF]">
              {userGps.source === "demo"
                ? locale === "vi"
                  ? "GPS Giả lập"
                  : "Demo GPS"
                : `±${userGps.accuracy}m`}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            data-testid="gps-locate-button"
            onClick={handleStartLiveGps}
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-extrabold transition-all duration-150 active:scale-[0.97] cursor-pointer ${
              isLocating
                ? "bg-[#4D73CF] text-white shadow-xs animate-pulse"
                : userGps?.source === "live"
                  ? "bg-[#4D73CF] text-white shadow-xs"
                  : "border border-[#E6DECB] bg-[#FFF8EB] text-[#272E2B] hover:bg-[#F5EFE2]"
            }`}
          >
            <AppIcon
              icon={isLocating ? Loader2 : LocateFixed}
              size="xs"
              className={isLocating ? "animate-spin" : undefined}
            />
            <span>
              {isLocating
                ? locale === "vi"
                  ? "Đang định vị…"
                  : "Locating…"
                : locale === "vi"
                  ? "Vị trí của tôi"
                  : "Locate me"}
            </span>
          </button>

          <button
            type="button"
            data-testid="gps-demo-walk-button"
            onClick={() => setIsDemoWalking((prev) => !prev)}
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-extrabold transition-all duration-150 active:scale-[0.97] cursor-pointer ${
              isDemoWalking
                ? "bg-[#F07861] text-white shadow-xs"
                : "border border-[#E6DECB] bg-[#FFF8EB] text-[#272E2B] hover:bg-[#F5EFE2]"
            }`}
          >
            <AppIcon icon={Footprints} size="xs" />
            <span>
              {isDemoWalking
                ? locale === "vi"
                  ? "Đang đi…"
                  : "Walking…"
                : locale === "vi"
                  ? "Giả lập đi bộ"
                  : "Demo Walk"}
            </span>
          </button>

          <button
            type="button"
            data-testid="gps-recenter-button"
            onClick={handleRecenterZoo}
            aria-label={locale === "vi" ? "Về Thảo Cầm Viên" : "Recenter Zoo"}
            className="inline-flex items-center gap-1 rounded-full border border-[#E6DECB] bg-[#FFF8EB] px-2.5 py-1.5 text-xs font-extrabold text-[#525D58] hover:text-[#272E2B] transition-all duration-150 active:scale-[0.97] cursor-pointer"
          >
            <AppIcon icon={RotateCcw} size="xs" />
            <span className="hidden sm:inline">
              {locale === "vi" ? "Về Thảo Cầm Viên" : "Recenter Zoo"}
            </span>
          </button>
        </div>
      </div>

      {/* Geolocation Error Banner (never auto-starts Demo Walk) */}
      {gpsError && (
        <div
          data-testid="gps-error-banner"
          className="flex flex-wrap items-center justify-between gap-2 border-b border-[#DE634C]/40 bg-[#FDECE8] px-4 py-2.5 text-xs font-bold text-[#272E2B]"
        >
          <span className="flex-1">{gpsError}</span>
          <button
            type="button"
            onClick={() => setIsDemoWalking(true)}
            className="rounded-full bg-[#272E2B] px-2.5 py-1 text-[11px] font-extrabold text-white active:scale-[0.97] cursor-pointer"
          >
            {locale === "vi" ? "Giả lập đi bộ" : "Demo Walk"}
          </button>
        </div>
      )}

      {/* Amber Quick View Banner if User is > 500m from Saigon Zoo */}
      {userGps &&
        userGps.source === "live" &&
        distanceToZooCenter !== null &&
        distanceToZooCenter > 500 && (
          <div
            data-testid="gps-distance-banner"
            className="flex flex-wrap items-center justify-between gap-2 border-b border-[#F2C653] bg-[#FDF6DF] px-4 py-2 text-xs font-bold text-[#272E2B]"
          >
            <span>
              {locale === "vi"
                ? `Bạn cách Thảo Cầm Viên ${formatDistance(
                    distanceToZooCenter,
                    locale
                  )}.`
                : `You are ${formatDistance(
                    distanceToZooCenter,
                    locale
                  )} from Saigon Zoo.`}
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={handleCenterOnUser}
                className="rounded-full border border-[#E6DECB] bg-white px-2.5 py-1 text-[11px] font-extrabold text-[#4D73CF] hover:bg-[#EAF0FB] active:scale-[0.97] cursor-pointer"
              >
                {locale === "vi" ? "Vị trí của tôi" : "Center on me"}
              </button>
              <button
                type="button"
                onClick={handleFitUserAndZoo}
                className="rounded-full border border-[#E6DECB] bg-white px-2.5 py-1 text-[11px] font-extrabold text-[#176B61] hover:bg-[#E6F3F1] active:scale-[0.97] cursor-pointer"
              >
                {locale === "vi" ? "Xem cả tôi & TCV" : "Fit Me & Zoo"}
              </button>
              <button
                type="button"
                onClick={() => setIsDemoWalking(true)}
                className="rounded-full bg-[#272E2B] px-2.5 py-1 text-[11px] font-extrabold text-white active:scale-[0.97] cursor-pointer"
              >
                {locale === "vi" ? "Giả lập đi bộ" : "Demo Walk"}
              </button>
            </div>
          </div>
        )}

      {/* Interactive Leaflet Map Canvas */}
      <div className="relative">
        <div
          ref={mapContainerRef}
          data-testid="leaflet-map-canvas"
          className={`w-full ${compact ? "h-64 sm:h-72" : "h-[360px] sm:h-[440px]"}`}
        />

        {/* Quick Station Selector Chips Floating at Top of Map */}
        <div className="pointer-events-none absolute top-3 left-3 right-3 z-20 flex gap-1.5 overflow-x-auto pb-1">
          {sortedStations.map((st) => {
            const active = st.id === selectedStationId;
            const collected = isStationCollected(st.id);
            const dist = stationDistances[st.id];

            return (
              <button
                key={st.id}
                type="button"
                data-testid={`map-station-chip-${st.stamp.sortOrder}`}
                onClick={() => setSelectedStationId(st.id)}
                className={`pointer-events-auto shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-extrabold shadow-sm backdrop-blur-md transition-all duration-150 active:scale-[0.97] cursor-pointer ${
                  active
                    ? "border-[#176B61] bg-[#176B61] text-white"
                    : "border-[#E6DECB] bg-white/95 text-[#272E2B] hover:bg-[#FFF8EB]"
                }`}
              >
                <span className="type-mono text-[11px]">
                  {collected ? "✓" : `#${st.stamp.sortOrder}`}
                </span>
                <span>{t(st.name)}</span>
                {typeof dist === "number" && (
                  <span
                    className={`type-mono rounded-full px-1.5 py-0.2 text-[10px] ${
                      active
                        ? "bg-white/20 text-white"
                        : "bg-[#F5EFE2] text-[#525D58]"
                    }`}
                  >
                    {formatDistance(dist, locale)}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Interactive Bottom Sheet for Selected Station */}
      {selectedStation && (
        <div
          key={selectedStation.id}
          data-testid="map-station-sheet"
          className="animate-sheet-up border-t border-[#E6DECB] bg-[#FFFDF8] p-4"
        >
          <div className="flex items-center gap-3.5">
            <StationIllustration
              stationIdOrSlug={selectedStation.id}
              variant="avatar"
              className="h-16 w-16 shrink-0 border border-[#E6DECB] shadow-xs"
            />

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="type-mono rounded-full bg-[#F5EFE2] px-2 py-0.5 text-[10px] font-extrabold text-[#272E2B]">
                  #{selectedStation.stamp.sortOrder}
                </span>
                {isSelectedCollected ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#E6F3F1] px-2 py-0.5 text-[10px] font-extrabold text-[#176B61]">
                    <AppIcon icon={CheckCircle2} size="xs" />
                    {locale === "vi" ? "Đã đóng dấu" : "Stamped"}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#FDECE8] px-2 py-0.5 text-[10px] font-extrabold text-[#DE634C]">
                    <AppIcon icon={Radio} size="xs" />
                    {locale === "vi" ? "Chạm NFC tại trạm" : "Tap NFC at station"}
                  </span>
                )}
                {selectedDistance !== null && (
                  <span
                    data-testid="selected-station-distance"
                    className="type-mono inline-flex items-center gap-1 rounded-full bg-[#EAF0FB] px-2 py-0.5 text-[10px] font-extrabold text-[#4D73CF]"
                  >
                    <AppIcon icon={MapPin} size="xs" />
                    {formatDistance(selectedDistance, locale)}
                  </span>
                )}
              </div>

              <h3 className="font-display-serif mt-1 text-base font-extrabold text-[#272E2B] truncate">
                {t(selectedStation.name)}
              </h3>
              <p className="text-xs font-medium text-[#525D58] line-clamp-1">
                {t(selectedStation.locationHint)} —{" "}
                {t(selectedStation.description)}
              </p>
            </div>
          </div>

          <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 border-t border-[#E6DECB]/70 pt-3">
            <div className="flex items-center gap-2">
              <a
                href={getWalkingDirectionsUrl(
                  selectedStation.latitude,
                  selectedStation.longitude
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-[#E6DECB] bg-white px-3.5 py-2 text-xs font-extrabold text-[#272E2B] hover:bg-[#F5EFE2] transition-all active:scale-[0.97]"
              >
                <AppIcon icon={NavigationIcon} size="xs" className="text-[#4D73CF]" />
                <span>{locale === "vi" ? "Chỉ đường" : "Directions"}</span>
              </a>

              {compact && (
                <Link
                  href={`/map?station=${selectedStation.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#E6DECB] bg-white px-3.5 py-2 text-xs font-extrabold text-[#272E2B] hover:bg-[#F5EFE2] transition-all active:scale-[0.97]"
                >
                  <AppIcon icon={Compass} size="xs" className="text-[#176B61]" />
                  <span>{locale === "vi" ? "Mở bản đồ" : "Full Map"}</span>
                </Link>
              )}
            </div>

            <Link
              href={`/s/${selectedStation.tag.publicCode}`}
              data-testid="map-sheet-tap-link"
              className="inline-flex items-center gap-1.5 rounded-full bg-[#176B61] px-4 py-2 text-xs font-extrabold text-white shadow-xs hover:bg-[#12564E] transition-all active:scale-[0.97]"
            >
              <AppIcon icon={Radio} size="xs" className="text-[#F2C653]" />
              <span>
                {isSelectedCollected
                  ? locale === "vi"
                    ? "Mở trạm"
                    : "Open Station"
                  : locale === "vi"
                    ? "Chạm trạm NFC"
                    : "Tap NFC Station"}
              </span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
