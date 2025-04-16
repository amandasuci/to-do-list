'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Swal from 'sweetalert2';
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../app/lib/firebase';

type Task = {
  id: string;
  text: string;
  completed: boolean;
  deadline: string;
};

export default function TodoList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [timeRemaining, setTimeRemaining] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const fetchTasks = async () => {
      const querySnapshot = await getDocs(collection(db, 'tasks'));
      const tasksData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Task[];
      setTasks(tasksData);
    };
    fetchTasks();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const newTimeRemaining: { [key: string]: string } = {};
      tasks.forEach((task) => {
        newTimeRemaining[task.id] = calculateTimeRemaining(task.deadline);
      });
      setTimeRemaining(newTimeRemaining);
    }, 1000);

    return () => clearInterval(interval);
  }, [tasks]);

  const calculateTimeRemaining = (deadline: string): string => {
    const deadlineTime = new Date(deadline).getTime();
    const now = new Date().getTime();
    const difference = deadlineTime - now;

    if (difference <= 0) return '⏱ Waktu habis!';

    const hours = Math.floor(difference / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    return `${hours}j ${minutes}m ${seconds}d`;
  };

  const addTask = async (): Promise<void> => {
    const { value: formValues } = await Swal.fire({
      title: 'Tambah Tugas Baru',
      html: `
        <input id="swal-input1" class="swal2-input" placeholder="Nama tugas">
        <input id="swal-input2" type="datetime-local" class="swal2-input">
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Tambah',
      cancelButtonText: 'Batal',
      preConfirm: () => [
        (document.getElementById('swal-input1') as HTMLInputElement)?.value,
        (document.getElementById('swal-input2') as HTMLInputElement)?.value,
      ],
    });

    if (formValues && formValues[0] && formValues[1]) {
      const newTask: Omit<Task, 'id'> = {
        text: formValues[0],
        completed: false,
        deadline: formValues[1],
      };
      const docRef = await addDoc(collection(db, 'tasks'), newTask);
      setTasks([...tasks, { id: docRef.id, ...newTask }]);
    }
  };

  const editTask = async (task: Task) => {
    const { value: formValues } = await Swal.fire({
      title: 'Edit Tugas',
      html: `
        <input id="swal-input1" class="swal2-input" value="${task.text}">
        <input id="swal-input2" type="datetime-local" class="swal2-input" value="${task.deadline}">
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Simpan',
      cancelButtonText: 'Batal',
      preConfirm: () => [
        (document.getElementById('swal-input1') as HTMLInputElement)?.value,
        (document.getElementById('swal-input2') as HTMLInputElement)?.value,
      ],
    });

    if (formValues && formValues[0] && formValues[1]) {
      const updatedTask = { ...task, text: formValues[0], deadline: formValues[1] };
      const taskRef = doc(db, 'tasks', task.id);
      await updateDoc(taskRef, {
        text: updatedTask.text,
        deadline: updatedTask.deadline,
      });
      setTasks(tasks.map((t) => (t.id === task.id ? updatedTask : t)));
    }
  };

  const toggleTask = async (id: string): Promise<void> => {
    const updatedTasks = tasks.map((task) =>
      task.id === id ? { ...task, completed: !task.completed } : task
    );
    setTasks(updatedTasks);
    const taskRef = doc(db, 'tasks', id);
    await updateDoc(taskRef, {
      completed: updatedTasks.find((task) => task.id === id)?.completed,
    });
  };

  const deleteTask = async (id: string): Promise<void> => {
    await deleteDoc(doc(db, 'tasks', id));
    setTasks(tasks.filter((task) => task.id !== id));
  };

  return (
    <div className="max-w-2xl mx-auto mt-12 p-6 bg-purple-500 rounded-2xl shadow-lg">
      <h1 className="text-3xl font-bold text-center text-blue-700 mb-6">📝 To-Do List</h1>
      <div className="flex justify-center mb-6">
        <button
          onClick={addTask}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-full transition-all"
        >
          ➕ Tambah Tugas
        </button>
      </div>
      <ul className="space-y-4">
        <AnimatePresence>
          {tasks.map((task) => {
            const timeLeft = timeRemaining[task.id] || 'Menghitung...';
            const isExpired = timeLeft.includes('habis');
            const taskColor = task.completed
              ? 'bg-green-100 border-green-400'
              : isExpired
              ? 'bg-red-100 border-red-400'
              : 'bg-yellow-100 border-yellow-400';

            return (
              <motion.li
                key={task.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className={`border-l-4 ${taskColor} rounded-lg p-4 shadow-sm`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span
                    onClick={() => toggleTask(task.id)}
                    className={`cursor-pointer ${
                      task.completed ? 'line-through text-gray-500' : 'text-gray-800 font-semibold'
                    }`}
                  >
                    {task.text}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => editTask(task)}
                      className="text-blue-600 hover:text-blue-800"
                      title="Edit"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="text-red-600 hover:text-red-800"
                      title="Hapus"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  <p>📅 {new Date(task.deadline).toLocaleString()}</p>
                  <p>{timeLeft}</p>
                </div>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
    </div>
  );
}
