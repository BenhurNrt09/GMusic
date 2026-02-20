'use client';

import React from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { usePlayerStore } from '@/store/playerStore';
import type { Song } from '@gmusic/database';
import { IoReorderTwoOutline, IoPlaySharp, IoClose } from 'react-icons/io5';

interface SortableItemProps {
    song: Song;
    index: number;
}

function SortableSongItem({ song, index }: SortableItemProps) {
    const { currentSong, playSong, queue, removeFromQueue } = usePlayerStore();
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: song.id });

    const style = {
        transform: transform ? CSS.Translate.toString({
            ...transform,
            x: 0 // Restriction for vertical only
        }) : undefined,
        transition,
        zIndex: isDragging ? 2 : 1,
    };

    const isActive = currentSong?.id === song.id;

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`flex items-center gap-3 p-2 rounded-lg transition-colors group ${isDragging ? 'bg-white/10 shadow-xl' : 'hover:bg-white/5'
                } ${isActive ? 'bg-white/5' : ''}`}
        >
            <button
                {...attributes}
                {...listeners}
                className="text-gray-600 hover:text-gray-400 cursor-grab active:cursor-grabbing p-1"
            >
                <IoReorderTwoOutline className="text-xl" />
            </button>

            <div
                className="relative w-10 h-10 rounded overflow-hidden bg-white/10 cursor-pointer"
                onClick={() => playSong(song, queue)}
            >
                {song.cover_url && <img src={song.cover_url} alt="" className="w-full h-full object-cover" />}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <IoPlaySharp className="text-white text-sm" />
                </div>
            </div>

            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => playSong(song, queue)}>
                <p className={`text-sm font-medium truncate ${isActive ? 'text-[#c68cfa]' : 'text-white'}`}>
                    {song.title}
                </p>
                <p className="text-xs text-gray-500 truncate">
                    {song.artist?.name || 'Bilinmiyor'}
                </p>
            </div>

            <button
                onClick={(e) => {
                    e.stopPropagation();
                    removeFromQueue(song.id);
                }}
                className="p-2 text-gray-500 hover:text-white opacity-0 group-hover:opacity-100 transition-all rounded-full hover:bg-white/10"
                title="Kuyruktan Kaldır"
            >
                <IoClose className="text-lg" />
            </button>
        </div>
    );
}

export default function QueueList() {
    const { queue, setQueue, clearQueue } = usePlayerStore();

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = queue.findIndex((s) => s.id === active.id);
            const newIndex = queue.findIndex((s) => s.id === over.id);
            setQueue(arrayMove(queue, oldIndex, newIndex));
        }
    }

    if (queue.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                <p className="text-gray-500 text-sm">Kuyruk boş</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between px-2">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Sıradaki</span>
                <button
                    onClick={clearQueue}
                    className="text-xs font-bold text-[#c68cfa] hover:text-[#d4a5fb] transition-colors"
                >
                    Tümünü Temizle
                </button>
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={queue.map(s => s.id)}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="flex flex-col gap-1">
                        {queue.map((song, index) => (
                            <SortableSongItem key={song.id} song={song} index={index} />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>
        </div>
    );
}
