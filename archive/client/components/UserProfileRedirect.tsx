import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect } from "react";

export default function UserProfileRedirect() {
  // ⚠️ DEAKTIVIERT: Automatische Weiterleitung komplett ausgeschaltet
  // const { user } = useAuth();
  // const [location, setLocation] = useLocation();

  // useEffect(() => {
  //   // Nur bei Root-Path weiterleiten
  //   if (location === "/" && user && 'userProfile' in user && user.userProfile?.startPage) {
  //     console.log(`🔄 Weiterleitung zur Startseite: ${user.userProfile.startPage}`);
  //     setLocation(user.userProfile.startPage);
  //   }
  // }, [location, user, setLocation]);
  
  return null; // Diese Komponente rendert nichts sichtbares
}