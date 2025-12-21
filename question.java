import java.util.Scanner;

public class question {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int score = 0;

        String[] questions = {
            "1. Which of these is a valid keyword in Java?",
            "2. What is the size of an int in Java?",
            "3. Which method is the entry point of a Java program?",
            "4. Which of these is NOT a Java access modifier?",
            "5. Which of the following is used to create objects in Java?"
        };

        String[][] options = {
            {"A. interface", "B. string", "C. Float", "D. integer"},
            {"A. 8 bits", "B. 16 bits", "C. 32 bits", "D. 64 bits"},
            {"A. start()", "B. main()", "C. run()", "D. init()"},
            {"A. public", "B. protected", "C. private", "D. package"},
            {"A. new", "B. create", "C. object", "D. class"}
        };

        char[] answers = {'A', 'C', 'B', 'D', 'A'};

        for (int i = 0; i < questions.length; i++) {
            System.out.println(questions[i]);
            for (String option : options[i]) {
                System.out.println(option);
            }
            System.out.print("Enter your choice (A/B/C/D): ");
            char userAnswer = sc.next().toUpperCase().charAt(0);

            if (userAnswer == answers[i]) {
                System.out.println("Correct!\n");
                score++;
            } else {
                System.out.println("Wrong! The correct answer is " + answers[i] + "\n");
            }
        }

        System.out.println("Your final score is " + score + "/" + questions.length);
        sc.close();
    }
}
