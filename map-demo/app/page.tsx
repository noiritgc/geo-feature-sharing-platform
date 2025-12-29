'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import styles from './page.module.css';
import { signInWithGoogle } from './auth';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { auth, db } from './firebase';
import { collection, getDocs, addDoc, setDoc, doc, getDoc } from 'firebase/firestore';

const Map = dynamic(() => import('./MapComponent'), { ssr: false });

interface Group {
  id: string;
  name: string;
}

interface SavedPolygon {
  id: string;
  name: string;
  info: string;
  polygon: { lat: number; lng: number }[];
  group?: string;
  userId?: string;
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [groups, setGroups] = useState<Group[]>([]);
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [groupPanelOpen, setGroupPanelOpen] = useState(false);
  const [groupsOpen, setGroupsOpen] = useState(false);

  const [bucketOpen, setBucketOpen] = useState(false);
  const [bucketSearch, setBucketSearch] = useState('');
  const [groupAreaSearch, setGroupAreaSearch] = useState('');

  const [createAreaActive, setCreateAreaActive] = useState(false);
  const [searchAreaActive, setSearchAreaActive] = useState(false);

  const [bucketItems, setBucketItems] = useState<SavedPolygon[]>([]);
  const [groupAreas, setGroupAreas] = useState<SavedPolygon[]>([]);
  const [selectedArea, setSelectedArea] = useState<SavedPolygon | null>(null);

  const [creatingGroup, setCreatingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');

  /* ---------- FRIENDS ----------- */
  const [friendsOpen, setFriendsOpen] = useState(false);
  const [friends, setFriends] = useState<{ uid: string, name: string }[]>([]);
  const [newFriendId, setNewFriendId] = useState('');

  const fetchFriends = async () => {
    if (!user) return;
    const snap = await getDocs(collection(db, `users/${user.uid}/friends`));
    const list = snap.docs.map(d => ({
      uid: d.id,
      name: d.data().name || "(No Name Found)"
    }));
    setFriends(list);
  };

  const addFriend = async () => {
    if (!user || !newFriendId.trim()) return;
    const targetUid = newFriendId.trim();

    if (targetUid === user.uid) {
      alert("You cannot add yourself.");
      return;
    }

    const targetRef = doc(db, "users", targetUid);
    const targetSnap = await getDoc(targetRef);
    if (!targetSnap.exists()) {
      alert("No user exists with that UID.");
      return;
    }

    const friendRef = doc(db, `users/${user.uid}/friends/${targetUid}`);
    const existing = await getDoc(friendRef);
    if (existing.exists()) {
      alert("Already a friend.");
      return;
    }

    await setDoc(friendRef, {
      name: targetSnap.data().name || "Unnamed User",
      addedAt: new Date()
    });

    setNewFriendId("");
    fetchFriends();
  };

  const copyUid = (uid: string) => {
    navigator.clipboard.writeText(uid);
    alert("UID copied to clipboard.");
  };

  /* ---------- AUTH ---------- */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setAuthLoading(false);

      if (u) {
        await setDoc(doc(db, "users", u.uid), {
          uid: u.uid,
          name: u.displayName,
          email: u.email,
        }, { merge: true });
      }
    });
    return () => unsub();
  }, []);

  /* ---------- GROUPS ---------- */
  useEffect(() => {
    if (!user) return setGroups([]);
    getDocs(collection(db, 'groups')).then((snap) => {
      setGroups(snap.docs.map(d => ({ id: d.id, name: d.data().name })));
    });
  }, [user]);

  /* ---------- BUCKET ---------- */
  useEffect(() => {
    if (!bucketOpen || !user) return;
    const fetchBucket = async () => {
      const snap = await getDocs(collection(db, 'polygons'));
      const personal = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }))
        .filter(p => p.userId === user.uid);
      setBucketItems(personal);
    };
    fetchBucket();
  }, [bucketOpen, user]);

  /* ---------- GROUP AREAS ---------- */
  useEffect(() => {
    if (!activeGroup) return setGroupAreas([]);
    const fetchGroupAreas = async () => {
      const snap = await getDocs(collection(db, 'polygons'));
      setGroupAreas(
        snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }))
          .filter(p => p.group === activeGroup)
      );
    };
    fetchGroupAreas();
  }, [activeGroup]);

  if (authLoading) return <div style={{ padding: 20 }}>Loading…</div>;

  return (
    <div className={styles.container}>
      <Map
        createAreaActive={createAreaActive}
        searchAreaActive={searchAreaActive}
        activeGroupId={activeGroup}
        personalCollection={!activeGroup}
        user={user}
        selectedArea={selectedArea}
      />

      {/* ================= LEFT PANEL ================= */}
      <div className={styles.leftPanel}>

        {!user ? (
          <button className={styles.authSignInButton} onClick={signInWithGoogle}>
            Sign in with Google
          </button>
        ) : (
          <div className={styles.authContainer}>
            <div className={styles.authUserLabel}>
              Signed in as <strong>{user.displayName}</strong>
            </div>
            <button className={styles.authLogoutButton} onClick={() => signOut(auth)}>
              Log Out
            </button>
          </div>
        )}


        {/* FRIENDS SECTION */}
        <div className={styles.friendsSection}>

          {user && (
            <div className={styles.friendsToggle}
              onClick={() => {
                setFriendsOpen(!friendsOpen);
                if (!friendsOpen) fetchFriends();
              }}>
              Friends ▾
            </div>
          )}

          {friendsOpen && user && (
            <div className={styles.friendsPanel}>

              <div className={styles.friendUidRow}>
                Your ID: <strong>{user.uid}</strong>
              </div>

              <input
                className={styles.friendInput}
                value={newFriendId}
                placeholder="Enter friend UID"
                onChange={e => setNewFriendId(e.target.value)}
              />

              <button className={styles.friendAddButton} onClick={addFriend}>
                Add Friend
              </button>

              <div className={styles.friendListTitle}>Your Friends:</div>

              {friends.length === 0 && <div>No friends yet</div>}

              {friends.map(f => (
                <div key={f.uid} className={styles.friendListItem}>
                  <span>{f.name}</span>
                  <span
                    className={styles.friendCopyButton}
                    onClick={() => copyUid(f.uid)}
                  >
                    Copy UID
                  </span>
                </div>
              ))}

            </div>
          )}
        </div>


      </div>

      {/* RIGHT PANEL */}
      {user && (
        <div className={styles.rightPanel}>
          {/* BUCKET SECTION */}
          <div className={styles.bucketSection}>

            <div className={styles.bucketToggle} onClick={() => setBucketOpen(!bucketOpen)}>
              My Bucket ▾
            </div>

            {bucketOpen && user && (
              <div className={styles.bucketPanel}>

                <input
                  className={styles.bucketSearchInput}
                  placeholder="Search bucket"
                  value={bucketSearch}
                  onChange={e => setBucketSearch(e.target.value)}
                />

                <div
                  className={styles.bucketAddButton}
                  onClick={() => {
                    setActiveGroup(null);
                    setCreateAreaActive(true);
                    setSearchAreaActive(false);
                  }}
                >
                  + Add
                </div>

                {bucketItems
                  .filter(b => b.name.toLowerCase().includes(bucketSearch.toLowerCase()))
                  .map(b => (
                    <div
                      key={b.id}
                      className={styles.bucketItem}
                      onClick={() => setSelectedArea(b)}
                    >
                      {b.name}
                    </div>
                  ))
                }

              </div>
            )}

          </div>


          {/* GROUPS */}
          <div className={styles.groupsSection}>
            <div
              className={`${styles.groupsHeader} ${!user ? styles.groupsHeaderDisabled : ""}`}
              onClick={() => user && setGroupsOpen(!groupsOpen)}
            >
              My Groups ▾
            </div>

            {groupsOpen && user && (
              <div className={styles.groupsPanel}>

                <div
                  className={styles.groupsAddBtn}
                  onClick={() => { setGroupPanelOpen(false); setCreatingGroup(true); }}
                >
                  + Add
                </div>

                {creatingGroup && (
                  <div className={styles.groupsCreateBox}>
                    <input
                      className={styles.groupsInput}
                      placeholder="Group name"
                      value={newGroupName}
                      onChange={e => setNewGroupName(e.target.value)}
                    />
                    <button className={styles.groupsCreateButton}
                      onClick={async () => {
                        if (!newGroupName.trim()) return;
                        const ref = await addDoc(collection(db, 'groups'), {
                          name: newGroupName.trim(), createdAt: new Date()
                        });
                        setGroups(prev => [...prev, { id: ref.id, name: newGroupName.trim() }]);
                        setActiveGroup(ref.id);
                        setGroupPanelOpen(true);
                        setCreatingGroup(false);
                        setNewGroupName('');
                      }}
                    >
                      Create Group
                    </button>
                  </div>
                )}

                {groups.map(g => (
                  <div
                    key={g.id}
                    className={`${styles.groupItem} ${g.id === activeGroup ? styles.groupItemActive : ""}`}
                    onClick={() => { setActiveGroup(g.id); setGroupPanelOpen(true); }}
                  >
                    {g.name}
                  </div>
                ))}
              </div>
            )}
          </div>


        </div>
      )}

      {/* GROUP PANEL */}
      {groupPanelOpen && activeGroup && (
        <div className={styles.groupAreasPopup}>
          <div className={styles.groupAreasTitle}>Group Areas</div>

          <input
            className={styles.groupAreasInput}
            placeholder="Search areas"
            value={groupAreaSearch}
            onChange={e => setGroupAreaSearch(e.target.value)}
          />

          <div
            className={styles.groupAreasAdd}
            onClick={() => setCreateAreaActive(true)}
          >
            + Add
          </div>

          {groupAreas
            .filter(a => a.name.toLowerCase().includes(groupAreaSearch.toLowerCase()))
            .map(a => (
              <div
                key={a.id}
                className={styles.groupAreasItem}
                onClick={() => setSelectedArea(a)}
              >
                {a.name}
              </div>
            ))
          }
        </div>

      )}

    </div>
  );
}
