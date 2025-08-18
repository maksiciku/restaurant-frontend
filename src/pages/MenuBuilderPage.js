import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';

const MenuBuilderPage = () => {
  const [meals, setMeals] = useState([]);
  const [sections, setSections] = useState([
    { name: 'Starters', items: [] },
    { name: 'Mains', items: [] },
    { name: 'Desserts', items: [] },
  ]);

  const navigate = useNavigate(); // ✅ THIS FIXES THE ERROR

  useEffect(() => {
    fetchMeals();
  }, []);

  const fetchMeals = async () => {
  try {
    const token = localStorage.getItem('token'); // ✅ get token
    const res = await axios.get('http://localhost:5000/meals', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    setMeals(res.data);
  } catch (err) {
    toast.error('Failed to load meals');
    console.error('Error fetching meals:', err);
  }
};

  const onDragEnd = (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;

    // Same position
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) return;

    const draggedMeal = meals.find(m => m.id.toString() === draggableId);
    if (!draggedMeal) return;

    const newSections = [...sections];
    const section = newSections.find(sec => sec.name === destination.droppableId);
    if (section) {
      section.items.push(draggedMeal);
      setSections(newSections);
    }
  };

 const handleSave = () => {
  navigate('/menu-preview', { state: { sections } });
};

  return (
    <div style={{ display: 'flex', padding: 20 }}>
      <DragDropContext onDragEnd={onDragEnd}>
        {/* Meal list */}
        <Droppable droppableId="meals">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              style={{
                width: '30%',
                background: '#f3f3f3',
                padding: 10,
                borderRadius: 10,
                marginRight: 20,
              }}
            >
              <h3>All Meals</h3>
              {meals.map((meal, index) => (
                <Draggable
                  key={meal.id.toString()}
                  draggableId={meal.id.toString()}
                  index={index}
                >
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      style={{
                        padding: 10,
                        marginBottom: 8,
                        background: 'white',
                        borderRadius: 5,
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                        ...provided.draggableProps.style,
                      }}
                    >
                      {meal.name}
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>

        {/* Menu Sections */}
        {sections.map((section) => (
          <Droppable key={section.name} droppableId={section.name}>
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                style={{
                  flex: 1,
                  background: '#e8f0fe',
                  padding: 10,
                  margin: '0 10px',
                  borderRadius: 10,
                  minHeight: 300,
                }}
              >
                <h3>{section.name}</h3>
                {section.items.map((item, index) => (
                  <div
                    key={item.id}
                    style={{
                      padding: 10,
                      marginBottom: 8,
                      background: 'white',
                      borderRadius: 5,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    }}
                  >
                    {item.name}
                  </div>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        ))}
      </DragDropContext>

      <div style={{ position: 'absolute', bottom: 30, right: 30 }}>
        <button onClick={handleSave} style={{
          padding: '10px 20px',
          fontSize: '16px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: 6
        }}>Save Menu</button>
      </div>
    </div>
  );
};

export default MenuBuilderPage;
